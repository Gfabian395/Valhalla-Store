import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/store/ProductCard';
import { CategoryNav } from '../components/store/CategoryNav';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LISTA_TEMAS_COMERCIO, obtenerTemaComercio } from '../utils/temasComercio';

const BANNER_POR_DEFECTO = '/StoreGladius.png';
const MAX_IMAGENES_PRODUCTO = 3;
const MAX_ANCHO_IMAGEN = 640;
const CALIDAD_JPEG = 0.62;
const LIMITE_BYTES_FIRESTORE_SEGURO = 900000; // Margen seguro debajo de 1.048.576 bytes
const CLAVES_BASE_FICHA = ['marca', 'material', 'medidas'];

const estadoInicialProducto = (categoriaSugerida = '') => ({
  nombre: '',
  precioAnterior: '',
  precioOferta: '',
  imagen: '',
  imagenes: [],
  categoria: categoriaSugerida,
  etiqueta: 'OFERTA',
  usaTalles: false,
  tallesInput: '', // Input de texto editable por el usuario
  descripcion: '',
  fichaMarca: '',
  fichaMaterial: '',
  fichaMedidas: '',
  camposExtra: [] // Array de { id, clave, valor } para litros, capacidad, etc.
});

// Comprime y redimensiona una imagen en el navegador para evitar exceder 1 MiB en Firestore
const comprimirImagenEnNavegador = (
  file,
  maxAncho = MAX_ANCHO_IMAGEN,
  calidad = CALIDAD_JPEG
) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }

        ctx.drawImage(img, 0, 0, ancho, alto);
        const resultadoComprimido = canvas.toDataURL('image/jpeg', calidad);
        resolve(resultadoComprimido);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

const estimarBytesUtf8 = (valor) => {
  try {
    return new TextEncoder().encode(JSON.stringify(valor)).length;
  } catch {
    return JSON.stringify(valor).length;
  }
};

// Re-comprime imágenes en memoria si el documento completo supera el margen seguro
const comprimirListaSiExcedeLimite = async (imagenesActuales, armarPayloadFn) => {
  let lista = [...imagenesActuales];
  if (estimarBytesUtf8(armarPayloadFn(lista)) <= LIMITE_BYTES_FIRESTORE_SEGURO) {
    return lista;
  }

  const reescalarDataUrl = (dataUrl, maxAncho, calidad) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;
        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  lista = await Promise.all(lista.map((src) => reescalarDataUrl(src, 520, 0.52)));
  if (estimarBytesUtf8(armarPayloadFn(lista)) <= LIMITE_BYTES_FIRESTORE_SEGURO) {
    return lista;
  }

  lista = await Promise.all(lista.map((src) => reescalarDataUrl(src, 420, 0.45)));
  return lista;
};

const obtenerValorFicha = (fichaTecnica, claveBuscada) => {
  if (!fichaTecnica) return '';
  if (Array.isArray(fichaTecnica)) {
    const encontrada = fichaTecnica.find(
      (item) => item?.clave?.trim().toLowerCase() === claveBuscada.toLowerCase()
    );
    return encontrada?.valor !== undefined && encontrada?.valor !== null
      ? String(encontrada.valor)
      : '';
  }
  if (typeof fichaTecnica === 'object') {
    const entrada = Object.entries(fichaTecnica).find(
      ([clave]) => clave.trim().toLowerCase() === claveBuscada.toLowerCase()
    );
    return entrada && entrada[1] !== undefined && entrada[1] !== null
      ? String(entrada[1])
      : '';
  }
  return '';
};

const extraerCamposExtraFicha = (fichaTecnica) => {
  if (!fichaTecnica) return [];
  const pares = Array.isArray(fichaTecnica)
    ? fichaTecnica.filter((item) => item && (item.clave || item.valor))
    : typeof fichaTecnica === 'object'
    ? Object.entries(fichaTecnica).map(([clave, valor]) => ({ clave, valor }))
    : [];

  return pares
    .filter(
      ({ clave }) =>
        clave && !CLAVES_BASE_FICHA.includes(String(clave).trim().toLowerCase())
    )
    .map((item, index) => ({
      id: `${Date.now()}-${index}`,
      clave: item.clave ? String(item.clave) : '',
      valor: item.valor !== undefined && item.valor !== null ? String(item.valor) : ''
    }));
};

const obtenerImagenesProducto = (product) => {
  if (!product) return [];
  const lista = Array.isArray(product.imagenes)
    ? product.imagenes.filter(Boolean)
    : product.imagen
    ? [product.imagen]
    : [];
  return lista.slice(0, MAX_IMAGENES_PRODUCTO);
};

export const Home = ({ vistaAdmin }) => {
  const [productos, setProductos] = useState([]);
  const [categoriasDocs, setCategoriasDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todos');

  const [modalProdOpen, setModalProdOpen] = useState(false);
  const [modalCatOpen, setModalCatOpen] = useState(false);
  const [modalBannerOpen, setModalBannerOpen] = useState(false);
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [guardandoProd, setGuardandoProd] = useState(false);
  const [avisoProd, setAvisoProd] = useState('');

  // Estado del carrusel ampliado al hacer clic en una imagen de producto
  const [carruselProducto, setCarruselProducto] = useState(null);
  const [carruselIdx, setCarruselIdx] = useState(0);

  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [bannerComercio, setBannerComercio] = useState('');
  const [bannerError, setBannerError] = useState(false);
  const [guardandoBanner, setGuardandoBanner] = useState(false);
  const [avisoBanner, setAvisoBanner] = useState('');

  const [nuevoProd, setNuevoProd] = useState(() => estadoInicialProducto());
  const [nuevaCat, setNuevaCat] = useState('');

  const storeId = localStorage.getItem('valhalla_store_id') || '';
  const comercioGuardado = (() => {
    try {
      return JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    } catch {
      return {};
    }
  })();

  const [colorTema, setColorTema] = useState(
    () => comercioGuardado.colorTema || 'emerald'
  );
  const [guardandoTema, setGuardandoTema] = useState(false);

  const tema = obtenerTemaComercio(colorTema);

  const categoriasParaNav = [{ id: '__todos__', nombre: 'Todos' }, ...categoriasDocs];
  const categoriasEditables = categoriasDocs.map((c) => c.nombre).filter(Boolean);

  const fetchDataFromFirebase = async () => {
    if (!storeId) {
      setBannerComercio((comercioGuardado.bannerUrl || comercioGuardado.banner || '').trim());
      setColorTema(comercioGuardado.colorTema || 'emerald');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setBannerError(false);

      // Obtenemos datos del comercio para sincronizar el banner y el tema actual
      const comercioDocRef = doc(db, 'comercios', storeId);
      const comercioSnap = await getDoc(comercioDocRef);
      if (comercioSnap.exists()) {
        const dataComercio = comercioSnap.data();
        const urlActual = (
          dataComercio.bannerUrl ||
          dataComercio.banner ||
          comercioGuardado.bannerUrl ||
          ''
        ).trim();
        const temaActual = dataComercio.colorTema || comercioGuardado.colorTema || 'emerald';
        setBannerComercio(urlActual);
        setColorTema(temaActual);
        localStorage.setItem(
          'valhalla_comercio',
          JSON.stringify({
            ...comercioGuardado,
            ...dataComercio,
            bannerUrl: urlActual,
            colorTema: temaActual
          })
        );
      } else {
        setBannerComercio((comercioGuardado.bannerUrl || comercioGuardado.banner || '').trim());
        setColorTema(comercioGuardado.colorTema || 'emerald');
      }

      const prodSnapshot = await getDocs(collection(db, 'comercios', storeId, 'productos'));
      const listaProds = prodSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      setProductos(listaProds);

      const catSnapshot = await getDocs(collection(db, 'comercios', storeId, 'categorias'));
      const listaCats = catSnapshot.docs
        .map((item) => ({ id: item.id, nombre: item.data().nombre }))
        .filter((c) => Boolean(c.nombre));

      setCategoriasDocs(listaCats);

      const nombresActuales = listaCats.map((c) => c.nombre);
      if (filtroCat !== 'Todos' && !nombresActuales.includes(filtroCat)) {
        setFiltroCat('Todos');
      }
    } catch (error) {
      console.error('Aviso al sincronizar con Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromFirebase();
  }, [storeId]);

  const handleSeleccionarTema = async (nuevoTemaId) => {
    setColorTema(nuevoTemaId);
    setGuardandoTema(true);

    try {
      const comercioActual = (() => {
        try {
          return JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
        } catch {
          return {};
        }
      })();

      localStorage.setItem(
        'valhalla_comercio',
        JSON.stringify({ ...comercioActual, colorTema: nuevoTemaId })
      );
      window.dispatchEvent(
        new CustomEvent('valhalla:tema-cambiado', { detail: { colorTema: nuevoTemaId } })
      );

      if (storeId) {
        const comercioDocRef = doc(db, 'comercios', storeId);
        await updateDoc(comercioDocRef, { colorTema: nuevoTemaId });
      }
    } catch (error) {
      console.error('Error al guardar el tema del comercio:', error);
    } finally {
      setGuardandoTema(false);
    }
  };

  const handleAbrirCarrusel = (product, indiceInicial = 0) => {
    const imgs = obtenerImagenesProducto(product);
    if (imgs.length === 0) return;
    const idxValido = indiceInicial >= 0 && indiceInicial < imgs.length ? indiceInicial : 0;
    setCarruselProducto(product);
    setCarruselIdx(idxValido);
  };

  const handleCerrarCarrusel = () => {
    setCarruselProducto(null);
    setCarruselIdx(0);
  };

  const handleCarruselAnterior = () => {
    if (!carruselProducto) return;
    const imgs = obtenerImagenesProducto(carruselProducto);
    if (imgs.length <= 1) return;
    setCarruselIdx((prev) => (prev - 1 + imgs.length) % imgs.length);
  };

  const handleCarruselSiguiente = () => {
    if (!carruselProducto) return;
    const imgs = obtenerImagenesProducto(carruselProducto);
    if (imgs.length <= 1) return;
    setCarruselIdx((prev) => (prev + 1) % imgs.length);
  };

  const handleAbrirModalBanner = () => {
    setAvisoBanner('');
    setBannerUrlInput(bannerComercio || '');
    setModalBannerOpen(true);
  };

  const handleBannerArchivoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvisoBanner('');
      const comprimida = await comprimirImagenEnNavegador(file, 900, 0.65);
      setBannerUrlInput(comprimida);
    } catch (error) {
      console.error('Error al procesar banner:', error);
      setAvisoBanner('No se pudo procesar la imagen del banner.');
    } finally {
      e.target.value = '';
    }
  };

  const handleGuardarBanner = async (e) => {
    e.preventDefault();
    const urlLimpia = bannerUrlInput.trim();
    setGuardandoBanner(true);
    setAvisoBanner('');

    try {
      if (storeId) {
        if (estimarBytesUtf8({ bannerUrl: urlLimpia }) > LIMITE_BYTES_FIRESTORE_SEGURO) {
          setAvisoBanner(
            'La imagen del banner es demasiado pesada para Firestore. Probá con otra más liviana o una URL.'
          );
          setGuardandoBanner(false);
          return;
        }
        const comercioDocRef = doc(db, 'comercios', storeId);
        await updateDoc(comercioDocRef, {
          bannerUrl: urlLimpia
        });
      }

      setBannerComercio(urlLimpia);
      setBannerError(false);
      localStorage.setItem(
        'valhalla_comercio',
        JSON.stringify({ ...comercioGuardado, bannerUrl: urlLimpia, colorTema })
      );
      setModalBannerOpen(false);
    } catch (error) {
      console.error('Error al guardar el banner del comercio:', error);
      setAvisoBanner('No se pudo guardar el banner en Firebase.');
    } finally {
      setGuardandoBanner(false);
    }
  };

  const handleAbrirModalProducto = () => {
    setAvisoProd('');
    setProductoEditandoId(null);
    const categoriaSugerida = filtroCat !== 'Todos' ? filtroCat : categoriasEditables[0] || '';
    setNuevoProd(estadoInicialProducto(categoriaSugerida));
    setModalProdOpen(true);
  };

  const handleEditarProducto = (product) => {
    const imgsPrevias = obtenerImagenesProducto(product);
    setAvisoProd('');
    setProductoEditandoId(product.id);
    setNuevoProd({
      nombre: product.nombre || '',
      precioAnterior: product.precioAnterior ? String(product.precioAnterior) : '',
      precioOferta:
        product.precioOferta !== undefined && product.precioOferta !== null
          ? String(product.precioOferta)
          : product.precio
          ? String(product.precio)
          : '',
      imagen: imgsPrevias[0] || product.imagen || '',
      imagenes: imgsPrevias,
      categoria:
        product.categoria || (filtroCat !== 'Todos' ? filtroCat : categoriasEditables[0] || ''),
      etiqueta: product.etiqueta || 'OFERTA',
      usaTalles: Boolean(
        product.usaTalles || (Array.isArray(product.talles) && product.talles.length > 0)
      ),
      tallesInput:
        Array.isArray(product.talles) && product.talles.length > 0
          ? product.talles.join(', ')
          : '',
      descripcion: product.descripcion || '',
      fichaMarca: obtenerValorFicha(product.fichaTecnica, 'Marca'),
      fichaMaterial: obtenerValorFicha(product.fichaTecnica, 'Material'),
      fichaMedidas: obtenerValorFicha(product.fichaTecnica, 'Medidas'),
      camposExtra: extraerCamposExtraFicha(product.fichaTecnica)
    });
    setModalProdOpen(true);
  };

  const handleEliminarProducto = async (product) => {
    if (!storeId || !product?.id) return;
    const confirmado = window.confirm(
      `¿Eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, 'comercios', storeId, 'productos', product.id));
      setProductos((prev) => prev.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error('Error al eliminar producto en Firebase:', error);
      alert('No se pudo eliminar el producto. Intentá nuevamente.');
    }
  };

  const handleEliminarCategoria = async (categoriaObj) => {
    if (!storeId || !categoriaObj?.id || categoriaObj.nombre === 'Todos') return;
    const confirmado = window.confirm(
      `¿Eliminar la categoría "${categoriaObj.nombre}"? Los productos ya cargados no se borrarán.`
    );
    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, 'comercios', storeId, 'categorias', categoriaObj.id));
      setCategoriasDocs((prev) => prev.filter((c) => c.id !== categoriaObj.id));
      if (filtroCat === categoriaObj.nombre) {
        setFiltroCat('Todos');
      }
    } catch (error) {
      console.error('Error al eliminar categoría en Firebase:', error);
      alert('No se pudo eliminar la categoría. Intentá nuevamente.');
    }
  };

  // Manejadores de campos técnicos editables extra (litros, capacidad, voltaje, etc.)
  const handleAgregarCampoExtra = () => {
    setNuevoProd((prev) => ({
      ...prev,
      camposExtra: [
        ...(prev.camposExtra || []),
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, clave: '', valor: '' }
      ]
    }));
  };

  const handleCambioCampoExtra = (idCampo, campoPropiedad, nuevoValor) => {
    setNuevoProd((prev) => ({
      ...prev,
      camposExtra: (prev.camposExtra || []).map((item) =>
        item.id === idCampo ? { ...item, [campoPropiedad]: nuevoValor } : item
      )
    }));
  };

  const handleEliminarCampoExtra = (idCampo) => {
    setNuevoProd((prev) => ({
      ...prev,
      camposExtra: (prev.camposExtra || []).filter((item) => item.id !== idCampo)
    }));
  };

  // Permite cargar hasta 3 imágenes comprimidas en el navegador (máximo 3 en total)
  const handleImagenesChange = async (e) => {
    const archivosSeleccionados = Array.from(e.target.files || []);
    if (archivosSeleccionados.length === 0) return;

    const cupoDisponible = MAX_IMAGENES_PRODUCTO - (nuevoProd.imagenes?.length || 0);
    if (cupoDisponible <= 0) {
      setAvisoProd(`Solo se permiten hasta ${MAX_IMAGENES_PRODUCTO} imágenes por producto.`);
      e.target.value = '';
      return;
    }

    const archivosAProcesar = archivosSeleccionados.slice(0, cupoDisponible);

    try {
      setAvisoProd('');
      const imagenesComprimidas = await Promise.all(
        archivosAProcesar.map((file) =>
          comprimirImagenEnNavegador(file, MAX_ANCHO_IMAGEN, CALIDAD_JPEG)
        )
      );

      setNuevoProd((prev) => {
        const actualizadas = [...(prev.imagenes || []), ...imagenesComprimidas].slice(
          0,
          MAX_IMAGENES_PRODUCTO
        );
        return {
          ...prev,
          imagenes: actualizadas,
          imagen: actualizadas[0] || ''
        };
      });
    } catch (error) {
      console.error('Error al comprimir imágenes:', error);
      setAvisoProd('No se pudieron procesar una o más imágenes.');
    } finally {
      e.target.value = '';
    }
  };

  const handleQuitarImagen = (indiceAQuitar) => {
    setAvisoProd('');
    setNuevoProd((prev) => {
      const actualizadas = (prev.imagenes || []).filter((_, idx) => idx !== indiceAQuitar);
      return {
        ...prev,
        imagenes: actualizadas,
        imagen: actualizadas[0] || ''
      };
    });
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    if (!storeId) return;

    const listaImagenes = (nuevoProd.imagenes || []).slice(0, MAX_IMAGENES_PRODUCTO);
    if (listaImagenes.length === 0 && !nuevoProd.imagen) return;

    setGuardandoProd(true);
    setAvisoProd('');
    try {
      const categoriaDestino =
        nuevoProd.categoria ||
        (filtroCat !== 'Todos' ? filtroCat : categoriasEditables[0] || 'General');

      // Convertimos el texto escrito a mano ("S, M, L") en un array limpio ['S', 'M', 'L']
      const arrayTalles = nuevoProd.usaTalles
        ? nuevoProd.tallesInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // Armamos la ficha técnica básica combinando campos rápidos y campos extra editables
      const fichaTecnica = [];
      if (nuevoProd.fichaMarca.trim()) {
        fichaTecnica.push({ clave: 'Marca', valor: nuevoProd.fichaMarca.trim() });
      }
      if (nuevoProd.fichaMaterial.trim()) {
        fichaTecnica.push({ clave: 'Material', valor: nuevoProd.fichaMaterial.trim() });
      }
      if (nuevoProd.fichaMedidas.trim()) {
        fichaTecnica.push({ clave: 'Medidas', valor: nuevoProd.fichaMedidas.trim() });
      }
      for (const extra of nuevoProd.camposExtra || []) {
        const claveLimpia = (extra.clave || '').trim();
        const valorLimpio = (extra.valor || '').trim();
        if (claveLimpia && valorLimpio) {
          fichaTecnica.push({ clave: claveLimpia, valor: valorLimpio });
        }
      }

      const baseImagenes =
        listaImagenes.length > 0 ? listaImagenes : [nuevoProd.imagen].filter(Boolean);

      const armarPayload = (imgs) => ({
        nombre: nuevoProd.nombre.trim(),
        categoria: categoriaDestino.trim(),
        precioAnterior: Number(nuevoProd.precioAnterior) || 0,
        precioOferta: Number(nuevoProd.precioOferta) || 0,
        imagen: imgs[0] || '',
        imagenes: imgs,
        descripcion: nuevoProd.descripcion.trim(),
        fichaTecnica,
        etiqueta: nuevoProd.etiqueta,
        usaTalles: nuevoProd.usaTalles,
        talles: arrayTalles
      });

      const imagenesFinales = await comprimirListaSiExcedeLimite(baseImagenes, armarPayload);
      const datosProducto = armarPayload(imagenesFinales);

      const pesoEstimado = estimarBytesUtf8(datosProducto);
      if (pesoEstimado > LIMITE_BYTES_FIRESTORE_SEGURO) {
        setAvisoProd(
          `El producto pesa ${(pesoEstimado / 1024).toFixed(0)} KB y supera el límite seguro de Firestore (1 MB). Quitá una imagen o usá fotos más livianas.`
        );
        setGuardandoProd(false);
        return;
      }

      if (productoEditandoId) {
        await updateDoc(
          doc(db, 'comercios', storeId, 'productos', productoEditandoId),
          datosProducto
        );
      } else {
        await addDoc(collection(db, 'comercios', storeId, 'productos'), datosProducto);
      }

      setModalProdOpen(false);
      setProductoEditandoId(null);
      setNuevoProd(estadoInicialProducto());
      fetchDataFromFirebase();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setAvisoProd(
        'Firestore rechazó el guardado (probablemente por tamaño de imágenes). Probá con menos fotos o menor resolución.'
      );
    } finally {
      setGuardandoProd(false);
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat.trim() || !storeId) return;

    try {
      await addDoc(collection(db, 'comercios', storeId, 'categorias'), { nombre: nuevaCat.trim() });
      setNuevaCat('');
      setModalCatOpen(false);
      fetchDataFromFirebase();
    } catch (error) {
      console.error('Error al guardar categoría en Firebase:', error);
    }
  };

  const productosFiltrados =
    filtroCat === 'Todos'
      ? productos
      : productos.filter(
          (p) => p.categoria?.trim().toLowerCase() === filtroCat.trim().toLowerCase()
        );

  const nombreComercioMostrar =
    comercioGuardado.name || comercioGuardado.nombreComercio || 'Mi Tienda';
  const bannerSrc = !bannerError && bannerComercio ? bannerComercio : BANNER_POR_DEFECTO;
  const cantidadImagenesActuales = nuevoProd.imagenes?.length || 0;

  const imagenesCarruselActual = obtenerImagenesProducto(carruselProducto);
  const slidesCarrusel =
    imagenesCarruselActual.length > 0 ? imagenesCarruselActual : [BANNER_POR_DEFECTO];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-w-0">
      {/* Banner del Comercio */}
      <section
        aria-label={`Banner de ${nombreComercioMostrar}`}
        className="relative w-full h-36 sm:h-52 md:h-60 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs mb-4 sm:mb-6"
      >
        <img
          src={bannerSrc}
          alt={`Banner de ${nombreComercioMostrar}`}
          onError={() => setBannerError(true)}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent flex items-end justify-between gap-2 sm:gap-4 p-3.5 sm:p-6 min-w-0">
          <div className="min-w-0">
            <span
              className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest block truncate ${tema.subtituloBanner}`}
            >
              Espacio del Comercio
            </span>
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-white leading-tight truncate">
              {nombreComercioMostrar}
            </h1>
          </div>

          {vistaAdmin && (
            <button
              type="button"
              onClick={handleAbrirModalBanner}
              className="bg-white/95 hover:bg-white text-slate-900 font-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider shadow cursor-pointer shrink-0 whitespace-nowrap transition-transform active:scale-95"
            >
              Cambiar Banner
            </button>
          )}
        </div>
      </section>

      {/* Pasamos vistaAdmin, el tema del comercio y eliminar categoría */}
      <CategoryNav
        categorias={categoriasParaNav}
        categoriaSeleccionada={filtroCat}
        onSelectCategoria={setFiltroCat}
        onAddCategory={() => setModalCatOpen(true)}
        onDeleteCategory={handleEliminarCategoria}
        vistaAdmin={vistaAdmin}
        tema={tema}
      />

      {vistaAdmin && (
        <div
          className={`bg-white border-2 ${tema.bordeDestacado} rounded-3xl p-4 sm:p-5 mb-6 shadow-xl shadow-slate-200/50 flex flex-col gap-4 text-slate-800`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${tema.iconoSuave}`}
              >
                <i className="bx bx-shield-alt-2 text-2xl font-black"></i>
              </div>
              <div className="min-w-0">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest inline-block px-2.5 py-0.5 rounded-full mb-1 border truncate max-w-full ${tema.badgeSuave}`}
                >
                  Panel Exclusivo Multi-Comercio ({nombreComercioMostrar})
                </span>
                <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 truncate">
                  Gestión de Catálogo ({filtroCat})
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAbrirModalProducto}
              disabled={categoriasEditables.length === 0}
              className={`w-full md:w-auto font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all cursor-pointer shrink-0 ${
                categoriasEditables.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : `${tema.botonPrimario} active:scale-95`
              }`}
            >
              <i className="bx bx-plus text-lg"></i> Agregar Producto
            </button>
          </div>

          {/* Selector de Tema por Comercio (Esmeralda por defecto + opciones femeninas y variadas) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Tema de color de tu tienda:
              </span>
              {guardandoTema && (
                <span className="text-[10px] font-bold text-slate-400 animate-pulse">
                  Guardando...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {LISTA_TEMAS_COMERCIO.map((opcionTema) => {
                const seleccionado = tema.id === opcionTema.id;
                return (
                  <button
                    key={opcionTema.id}
                    type="button"
                    onClick={() => handleSeleccionarTema(opcionTema.id)}
                    aria-pressed={seleccionado}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      seleccionado
                        ? `bg-slate-900 text-white border-slate-900 ring-2 ${opcionTema.anilloActivo}`
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${opcionTema.swatchClass}`}
                    ></span>
                    <span>{opcionTema.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <p
            className={`font-bold text-xs uppercase tracking-widest animate-pulse ${tema.loaderTexto}`}
          >
            Sincronizando con tu Base de Datos Aislada...
          </p>
        </div>
      ) : categoriasEditables.length === 0 && vistaAdmin ? (
        <div className="text-center py-16 bg-white backdrop-blur-md rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border ${tema.iconoSuave}`}
          >
            <i className="bx bx-folder-plus text-2xl"></i>
          </div>
          <p className="text-slate-900 font-black text-base">
            Aún no hay categorías creadas para este comercio
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Crea tu primera categoría para organizar tu inventario privado.
          </p>
          <button
            type="button"
            onClick={() => setModalCatOpen(true)}
            className={`font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer ${tema.botonPrimario}`}
          >
            + Crear Primera Categoría
          </button>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white backdrop-blur-md rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-slate-700 font-bold text-sm">
            No hay productos cargados en la categoría &ldquo;{filtroCat}&rdquo;.
          </p>
          {vistaAdmin && (
            <button
              type="button"
              onClick={handleAbrirModalProducto}
              className={`mt-3 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow cursor-pointer ${tema.botonPrimario}`}
            >
              + Cargar el primer producto aquí
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 min-w-0">
          {productosFiltrados.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              vistaAdmin={vistaAdmin}
              tema={tema}
              onEditProduct={handleEditarProducto}
              onDeleteProduct={handleEliminarProducto}
              onImageClick={handleAbrirCarrusel}
            />
          ))}
        </div>
      )}

      {/* Modal Carrusel Ampliado con Transición Suave de Desvanecimiento */}
      {carruselProducto && (
        <div
          onClick={handleCerrarCarrusel}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 md:p-6 shadow-2xl border border-slate-200 relative"
          >
            <button
              type="button"
              onClick={handleCerrarCarrusel}
              aria-label="Cerrar visor de imágenes"
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="pr-10 mb-3">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${tema.badgeSuave}`}
              >
                Galería ({carruselIdx + 1} / {slidesCarrusel.length})
              </span>
              <h3 className="text-base md:text-lg font-black text-slate-900 mt-1.5">
                {carruselProducto.nombre}
              </h3>
            </div>

            <div className="relative w-full h-64 sm:h-80 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              {slidesCarrusel.map((imgUrl, idx) => {
                const esActiva = idx === carruselIdx;
                return (
                  <img
                    key={`${idx}-${imgUrl.slice(0, 24)}`}
                    src={imgUrl}
                    alt={`${carruselProducto.nombre} - imagen ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-700 ease-in-out ${
                      esActiva ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  />
                );
              })}

              {slidesCarrusel.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleCarruselAnterior}
                    aria-label="Imagen anterior en carrusel"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg font-black cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleCarruselSiguiente}
                    aria-label="Siguiente imagen en carrusel"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg font-black cursor-pointer"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas del carrusel (hasta 3) */}
            {slidesCarrusel.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-4">
                {slidesCarrusel.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarruselIdx(idx)}
                    aria-label={`Seleccionar imagen ${idx + 1}`}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-slate-50 p-1 transition-all cursor-pointer ${
                      carruselIdx === idx
                        ? `${tema.miniaturaActiva} scale-105 shadow-xs`
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {carruselProducto.descripcion && (
              <p className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed">
                {carruselProducto.descripcion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Configurar Banner del Comercio */}
      {modalBannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalBannerOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span
                className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${tema.badgeSuave}`}
              >
                Identidad Visual
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2">
                Banner de {nombreComercioMostrar}
              </h3>
            </div>

            {/* Ayudita de medidas recomendadas para el comerciante */}
            <div
              className={`border rounded-2xl p-3 mb-4 text-[11px] leading-relaxed ${tema.panelTalles}`}
            >
              <p className="font-black uppercase tracking-wider text-[10px] mb-1">
                💡 Medida recomendada para que quede perfecto:
              </p>
              <p className="font-semibold">
                Usá una imagen <strong>horizontal (apaisada)</strong> de{' '}
                <strong>1200 × 300 px</strong> o <strong>1200 × 400 px</strong> (proporción{' '}
                <strong>4:1</strong> o <strong>3:1</strong>, aprox. <strong>31,7 × 7,9 cm</strong> o{' '}
                <strong>31,7 × 10,6 cm</strong> a 96 ppp) en formato <strong>JPG o PNG</strong>.
              </p>
              <p className="font-normal text-slate-600 mt-1">
                Centrá tu logo o diseño principal en el medio y evitá poner textos chicos en los
                bordes inferiores o en la esquina inferior derecha (donde va el botón{' '}
                <em>Cambiar Banner</em>).
              </p>
            </div>

            <form onSubmit={handleGuardarBanner} className="space-y-4 text-xs font-bold text-slate-600">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Subir Imagen desde el Dispositivo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerArchivoChange}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 font-normal file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black cursor-pointer outline-none transition-all ${tema.fileBtn}`}
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  O Pegar URL de Imagen
                </label>
                <input
                  type="text"
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  placeholder="https://..."
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                />
              </div>

              {avisoBanner && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-3">
                  {avisoBanner}
                </p>
              )}

              <button
                type="submit"
                disabled={guardandoBanner}
                className={`w-full disabled:opacity-60 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer ${tema.botonPrimario}`}
              >
                {guardandoBanner ? 'Guardando...' : 'Guardar Banner 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Categoría */}
      {modalCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setModalCatOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span
                className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${tema.badgeSuave}`}
              >
                SaaS Config
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2">
                Nueva Categoría
              </h3>
            </div>
            <form onSubmit={handleCrearCategoria} className="space-y-4">
              <input
                type="text"
                required
                value={nuevaCat}
                onChange={(e) => setNuevaCat(e.target.value)}
                placeholder="Ej: Bebidas, Almacén..."
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
              />
              <button
                type="submit"
                className={`w-full font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer ${tema.botonPrimario}`}
              >
                Guardar Categoría 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo / Editar Producto */}
      {modalProdOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setModalProdOpen(false);
                setProductoEditandoId(null);
                setAvisoProd('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span
                className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${tema.badgeSuave}`}
              >
                Inventario SaaS
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-2">
                {productoEditandoId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
            </div>
            <form
              onSubmit={handleGuardarProducto}
              className="space-y-3.5 text-xs font-bold text-slate-600"
            >
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Categoría
                </label>
                <select
                  value={nuevoProd.categoria}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })}
                  required
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                >
                  <option value="" disabled>
                    Seleccioná una categoría
                  </option>
                  {categoriasEditables.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={nuevoProd.nombre}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                  placeholder="Ej: Zapatillas Urbanas / Remera"
                />
              </div>

              {/* 🟢 CHECK DE HABILITACIÓN DE TALLES */}
              <div className={`border rounded-2xl p-3 space-y-2.5 ${tema.panelTalles}`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={nuevoProd.usaTalles}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, usaTalles: e.target.checked })}
                    className={`w-4 h-4 rounded border-slate-300 cursor-pointer ${tema.checkBox}`}
                  />
                  <span className="text-xs font-black">
                    ¿Este producto vende con talles? (Remeras, Zapatillas, etc.)
                  </span>
                </label>

                {/* Si está marcado, mostramos el input para escribir los talles a mano */}
                {nuevoProd.usaTalles && (
                  <div className="pt-1">
                    <label className="block text-[10px] uppercase font-bold mb-1">
                      Escribí los talles separados por comas:
                    </label>
                    <input
                      type="text"
                      required={nuevoProd.usaTalles}
                      value={nuevoProd.tallesInput}
                      onChange={(e) =>
                        setNuevoProd({ ...nuevoProd, tallesInput: e.target.value })
                      }
                      placeholder="Ej: S, M, L, XL o 39, 40, 41"
                      className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium placeholder-slate-400 focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                    Precio Anterior ($)
                  </label>
                  <input
                    type="number"
                    value={nuevoProd.precioAnterior}
                    onChange={(e) =>
                      setNuevoProd({ ...nuevoProd, precioAnterior: e.target.value })
                    }
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                    placeholder="3500"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                    Precio de Oferta ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={nuevoProd.precioOferta}
                    onChange={(e) =>
                      setNuevoProd({ ...nuevoProd, precioOferta: e.target.value })
                    }
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
                    placeholder="2899"
                  />
                </div>
              </div>

              {/* Ficha Técnica Básica Editable */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-700">
                    Ficha Técnica Básica (Opcional)
                  </span>
                  <button
                    type="button"
                    onClick={handleAgregarCampoExtra}
                    className={`text-[10px] font-black uppercase tracking-wider border px-2 py-1 rounded-lg cursor-pointer ${tema.badgeSuave}`}
                  >
                    + Campo (Litros, etc.)
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Descripción breve
                  </label>
                  <textarea
                    rows={2}
                    value={nuevoProd.descripcion}
                    onChange={(e) => setNuevoProd({ ...nuevoProd, descripcion: e.target.value })}
                    placeholder="Ej: Terminación reforzada, uso diario..."
                    className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-normal placeholder-slate-400 focus:ring-2 outline-none transition-all resize-none ${tema.inputFoco}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={nuevoProd.fichaMarca}
                      onChange={(e) => setNuevoProd({ ...nuevoProd, fichaMarca: e.target.value })}
                      placeholder="Ej: Gladius"
                      className={`w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-normal placeholder-slate-400 outline-none ${tema.inputFoco}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      value={nuevoProd.fichaMaterial}
                      onChange={(e) => setNuevoProd({ ...nuevoProd, fichaMaterial: e.target.value })}
                      placeholder="Ej: Algodón"
                      className={`w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-normal placeholder-slate-400 outline-none ${tema.inputFoco}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Medidas
                    </label>
                    <input
                      type="text"
                      value={nuevoProd.fichaMedidas}
                      onChange={(e) => setNuevoProd({ ...nuevoProd, fichaMedidas: e.target.value })}
                      placeholder="Ej: 80cm / Estándar"
                      className={`w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-normal placeholder-slate-400 outline-none ${tema.inputFoco}`}
                    />
                  </div>
                </div>

                {(nuevoProd.camposExtra || []).length > 0 && (
                  <div className="space-y-2 pt-1">
                    {nuevoProd.camposExtra.map((campo) => (
                      <div key={campo.id} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={campo.clave}
                          onChange={(e) =>
                            handleCambioCampoExtra(campo.id, 'clave', e.target.value)
                          }
                          placeholder="Campo (ej: Litros)"
                          className={`w-2/5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-normal placeholder-slate-400 outline-none ${tema.inputFoco}`}
                        />
                        <input
                          type="text"
                          value={campo.valor}
                          onChange={(e) =>
                            handleCambioCampoExtra(campo.id, 'valor', e.target.value)
                          }
                          placeholder="Valor (ej: 5L)"
                          className={`w-2/5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-normal placeholder-slate-400 outline-none ${tema.inputFoco}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarCampoExtra(campo.id)}
                          aria-label="Eliminar campo técnico"
                          className="w-1/5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl py-1.5 text-xs font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Imágenes del Producto (Máximo 3) */}
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Imágenes del Producto ({cantidadImagenesActuales}/{MAX_IMAGENES_PRODUCTO} máx.)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required={cantidadImagenesActuales === 0 && !nuevoProd.imagen}
                  disabled={cantidadImagenesActuales >= MAX_IMAGENES_PRODUCTO}
                  onChange={handleImagenesChange}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 font-normal file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black disabled:opacity-60 cursor-pointer outline-none transition-all ${tema.fileBtn}`}
                />

                {cantidadImagenesActuales > 0 && (
                  <div className="flex items-center gap-2 mt-2.5">
                    {nuevoProd.imagenes.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0"
                      >
                        <img
                          src={imgSrc}
                          alt={`Vista previa ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuitarImagen(idx)}
                          aria-label={`Quitar imagen ${idx + 1}`}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {avisoProd && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-3">
                  {avisoProd}
                </p>
              )}

              <button
                type="submit"
                disabled={guardandoProd}
                className={`w-full disabled:opacity-60 font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs md:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer mt-2 ${tema.botonPrimario}`}
              >
                {guardandoProd
                  ? 'Guardando...'
                  : productoEditandoId
                  ? 'Guardar Cambios 🚀'
                  : 'Publicar en Mi Tienda 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};