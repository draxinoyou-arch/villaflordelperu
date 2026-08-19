/* =========================================================
   VILLA FLOR DEL PERÚ
   WEB PÚBLICA + FIREBASE
========================================================= */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBJGg6noIYaNImmM7VDYD58WhkRTqh8q2M",
    authDomain: "villa-flor-del-peru.firebaseapp.com",
    projectId: "villa-flor-del-peru",
    storageBucket: "villa-flor-del-peru.firebasestorage.app",
    messagingSenderId: "979987696824",
    appId: "1:979987696824:web:4efcf348ca1ded2929384d"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await cargarDestacados();

            await cargarEmpresa();

            await cargarCategorias();

            iniciarNosotros();

            iniciarNavegacion();

            iniciarContacto();

        } catch (error) {

            console.error(
                "Error cargando la página:",
                error
            );

        }

    }
);


/* =========================================================
   PRODUCTOS DESTACADOS
   VILLA FLOR DEL PERÚ
========================================================= */

async function cargarDestacados() {

    const contenedor = document.querySelector(".products");

    if (!contenedor) {
        return;
    }

    try {

        const snapshot = await getDocs(
            collection(db, "villa_destacados")
        );

        contenedor.innerHTML = "";

        /* ==========================================
           SIN PRODUCTOS
        ========================================== */

        if (snapshot.empty) {

            const article = document.createElement("article");

            article.className = "product";

            article.innerHTML = `
                <div class="product-image">
                    <span>PRÓXIMAMENTE</span>
                </div>

                <h3>Productos destacados</h3>

                <p>Estamos preparando nuestra selección.</p>
            `;

            contenedor.appendChild(article);

            iniciarCarrusel();

            return;
        }


        /* ==========================================
           CARGAR PRODUCTOS
        ========================================== */

        snapshot.forEach((producto) => {

            const data = producto.data();

            const article = document.createElement("article");

            article.className = "product";

            article.innerHTML = `
                <div class="product-image">

                    ${
                        data.imagen
                            ? `
                                <img
                                    src="${escapeHtml(data.imagen)}"
                                    alt="${escapeHtml(
                                        data.nombre || "Producto"
                                    )}"
                                >
                              `
                            : `
                                <span>PLANTA</span>
                              `
                    }

                </div>

                <h3>
                    ${escapeHtml(
                        data.nombre || "Producto destacado"
                    )}
                </h3>

                <p>Planta seleccionada</p>
            `;


            /* ======================================
               ABRIR MODAL AL HACER CLICK
            ====================================== */

            article.addEventListener("click", () => {

                abrirModalPlanta(
                    {
                        nombre: data.nombre || "Producto destacado",
                        imagen: data.imagen || "",
                        cientifico: data.cientifico || "",
                        descripcion: data.descripcion || ""
                    },
                    "PRODUCTO DESTACADO"
                );

            });


            contenedor.appendChild(article);

        });


        iniciarCarrusel();

    } catch (error) {

        console.error(
            "Error cargando productos destacados:",
            error
        );

    }

}


/* =========================================================
   CARRUSEL INFINITO DE PRODUCTOS DESTACADOS
========================================================= */

let carouselIndex = 0;

let carouselProducts = [];

let carouselOriginalCount = 0;

let carouselContainer = null;

let carouselPrev = null;

let carouselNext = null;

let carouselStartX = 0;

let carouselEndX = 0;

let carouselAuto = null;

let carouselTransitioning = false;


/* =========================================================
   INICIAR CARRUSEL
========================================================= */

function iniciarCarrusel() {

    carouselContainer =
        document.querySelector(".products");

    carouselPrev =
        document.querySelector(".carousel-btn.prev");

    carouselNext =
        document.querySelector(".carousel-btn.next");


    if (!carouselContainer) {

        return;

    }


    /* ======================================
       DETENER AUTOMÁTICO ANTERIOR
    ====================================== */

    if (carouselAuto) {

        clearInterval(carouselAuto);

        carouselAuto = null;

    }


    /* ======================================
       OBTENER PRODUCTOS ORIGINALES
    ====================================== */

    carouselProducts =
        Array.from(
            carouselContainer.querySelectorAll(".product")
        );


    if (!carouselProducts.length) {

        return;

    }


    carouselOriginalCount =
        carouselProducts.length;


    carouselIndex = 0;

    carouselTransitioning = false;


    /* ======================================
       CUÁNTOS SE VEN
    ====================================== */

    const visibles =
        obtenerVisibles();


    /* ======================================
       CREAR COPIAS DE LOS PRIMEROS
    ====================================== */

    const copias =
        carouselProducts
            .slice(0, visibles)
            .map((productoOriginal) => {

                const copia =
                    productoOriginal.cloneNode(true);


                /* Permitir que la copia
                   también abra el producto */

                copia.addEventListener(
                    "click",
                    () => {

                        productoOriginal.click();

                    }
                );


                return copia;

            });


    copias.forEach((copia) => {

        carouselContainer.appendChild(copia);

    });


    /* ======================================
       VOLVER A OBTENER TODOS
    ====================================== */

    carouselProducts =
        Array.from(
            carouselContainer.querySelectorAll(".product")
        );


    /* ======================================
       CONFIGURAR
    ====================================== */

    carouselProducts.forEach(
        (producto) => {

            producto.style.flexShrink =
                "0";

            producto.style.boxSizing =
                "border-box";

            producto.style.transition =
                "transform 0.6s ease";

        }
    );


    /* ======================================
       MOSTRAR POSICIÓN INICIAL
    ====================================== */

    actualizarCarrusel(false);


    /* ======================================
       BOTÓN ANTERIOR
    ====================================== */

    if (carouselPrev) {

        carouselPrev.onclick = () => {

            moverCarrusel(-1);

            reiniciarAutomatico();

        };

    }


    /* ======================================
       BOTÓN SIGUIENTE
    ====================================== */

    if (carouselNext) {

        carouselNext.onclick = () => {

            moverCarrusel(1);

            reiniciarAutomatico();

        };

    }


    /* ======================================
       TOUCH — INICIO
    ====================================== */

    carouselContainer.ontouchstart =
        (event) => {

            carouselStartX =
                event.touches[0].clientX;

        };


    /* ======================================
       TOUCH — FINAL
    ====================================== */

    carouselContainer.ontouchend =
        (event) => {

            carouselEndX =
                event.changedTouches[0].clientX;


            const diferencia =
                carouselStartX -
                carouselEndX;


            if (diferencia > 50) {

                moverCarrusel(1);

                reiniciarAutomatico();

            }


            if (diferencia < -50) {

                moverCarrusel(-1);

                reiniciarAutomatico();

            }

        };


    /* ======================================
       AJUSTAR AL CAMBIAR TAMAÑO
    ====================================== */

    window.removeEventListener(
        "resize",
        actualizarCarruselResize
    );


    window.addEventListener(
        "resize",
        actualizarCarruselResize
    );


    /* ======================================
       INICIAR AUTOMÁTICO
    ====================================== */

    iniciarAutomatico();

}


/* =========================================================
   PRODUCTOS VISIBLES
========================================================= */

function obtenerVisibles() {

    /* CELULAR */

    if (window.innerWidth <= 700) {

        return 1;

    }


    /* TABLET */

    if (window.innerWidth <= 1100) {

        return 3;

    }


    /* PC */

    return 4;

}


/* =========================================================
   AJUSTAR AL CAMBIAR TAMAÑO
========================================================= */

function actualizarCarruselResize() {

    if (!carouselContainer) {

        return;

    }


    actualizarCarrusel(false);

}


/* =========================================================
   ACTUALIZAR CARRUSEL
========================================================= */

function actualizarCarrusel(animar = true) {

    if (
        !carouselContainer ||
        !carouselProducts.length
    ) {

        return;

    }


    const visibles =
        obtenerVisibles();


    const gap =
        visibles === 1
            ? 0
            : 18;


    const anchoContenedor =
        carouselContainer.clientWidth;


    const anchoProducto =
        (
            anchoContenedor -
            gap * (visibles - 1)
        ) / visibles;


    /* ======================================
       CONFIGURAR ANCHO
    ====================================== */

    carouselProducts.forEach(
        (producto) => {

            producto.style.width =
                `${anchoProducto}px`;

            producto.style.minWidth =
                `${anchoProducto}px`;

            producto.style.flex =
                `0 0 ${anchoProducto}px`;

            producto.style.marginRight =
                "0";

            producto.style.transition =
                animar
                    ? "transform 0.6s ease"
                    : "none";

        }
    );


    /* ======================================
       MOVIMIENTO
    ====================================== */

    const movimiento =
        carouselIndex *
        (
            anchoProducto +
            gap
        );


    carouselProducts.forEach(
        (producto) => {

            producto.style.transform =
                `translateX(-${movimiento}px)`;

        }
    );


    /* ======================================
       BOTONES
    ====================================== */

    actualizarBotones();

}


/* =========================================================
   MOVER
========================================================= */

function moverCarrusel(direccion) {

    if (
        carouselTransitioning ||
        !carouselProducts.length
    ) {

        return;

    }


    carouselIndex += direccion;


    /* ======================================
       SI RETROCEDEMOS ANTES DEL INICIO
    ====================================== */

    if (carouselIndex < 0) {

        carouselIndex =
            carouselOriginalCount - 1;

    }


    actualizarCarrusel(true);


    /* ======================================
       SI LLEGAMOS A LAS COPIAS
    ====================================== */

    if (
        carouselIndex >=
        carouselOriginalCount
    ) {

        carouselTransitioning = true;


        setTimeout(() => {

            carouselProducts.forEach(
                (producto) => {

                    producto.style.transition =
                        "none";

                }
            );


            carouselIndex = 0;


            actualizarCarrusel(false);


            /* Forzar actualización del navegador */

            void carouselContainer.offsetWidth;


            carouselProducts.forEach(
                (producto) => {

                    producto.style.transition =
                        "transform 0.6s ease";

                }
            );


            carouselTransitioning = false;

        }, 650);

    }

}


/* =========================================================
   BOTONES
========================================================= */

function actualizarBotones() {

    if (carouselPrev) {

        carouselPrev.style.opacity =
            "1";

        carouselPrev.disabled =
            false;

    }


    if (carouselNext) {

        carouselNext.style.opacity =
            "1";

        carouselNext.disabled =
            false;

    }

}


/* =========================================================
   AUTOMÁTICO
========================================================= */

function iniciarAutomatico() {

    if (carouselAuto) {

        clearInterval(carouselAuto);

    }


    carouselAuto =
        setInterval(() => {

            moverCarrusel(1);

        }, 2000);

}


/* =========================================================
   REINICIAR AUTOMÁTICO
========================================================= */

function reiniciarAutomatico() {

    iniciarAutomatico();

}


/* =========================================================
   FIN CARRUSEL INFINITO
========================================================= */
/* =========================================================
   NUESTRA EMPRESA
========================================================= */

async function cargarEmpresa() {

    const imagenPrincipal =
        document.getElementById(
            "about-main-image"
        );


    const numero =
        document.getElementById(
            "about-image-number"
        );


    const titulo =
        document.getElementById(
            "about-image-title"
        );


    if (!imagenPrincipal) {

        return;

    }


    const botones =
        document.querySelectorAll(
            ".about-value"
        );


    const datosEmpresa = {};


    for (
        const key of [
            "calidad",
            "seleccion",
            "proyeccion"
        ]
    ) {

        const referencia =
            doc(
                db,
                "villa_empresa",
                key
            );


        const resultado =
            await getDoc(
                referencia
            );


        if (
            resultado.exists()
        ) {

            datosEmpresa[key] =
                resultado.data();

        }

    }


    botones.forEach(
        (boton, index) => {

            const key =
                [
                    "calidad",
                    "seleccion",
                    "proyeccion"
                ][index];


            const data =
                datosEmpresa[key];


            if (
                data &&
                data.imagen
            ) {

                boton.dataset.image =
                    data.imagen;

            }

        }
    );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    boton.classList.add(
                        "active"
                    );


                    const imagen =
                        boton.dataset.image;


                    const numeroData =
                        boton.dataset.number;


                    const tituloData =
                        boton.dataset.title;


                    if (imagen) {

                        imagenPrincipal.src =
                            imagen;

                    }


                    if (numero) {

                        numero.textContent =
                            numeroData ||
                            "";

                    }


                    if (titulo) {

                        titulo.textContent =
                            tituloData ||
                            "";

                    }

                }
            );

        }
    );


    /*
       Si existe una imagen de Calidad
       la ponemos como imagen inicial.
    */

    if (
        datosEmpresa.calidad &&
        datosEmpresa.calidad.imagen
    ) {

        imagenPrincipal.src =
            datosEmpresa.calidad.imagen;

    }

}
/* =========================================================
   NUESTRA EMPRESA — NAVEGACIÓN MÓVIL
========================================================= */

function activarNavegacionEmpresaMovil() {

    const contenedor =
        document.querySelector(".about-values");

    const botones =
        document.querySelectorAll(".about-value");

    const imagen =
        document.getElementById("about-main-image");

    const numero =
        document.getElementById("about-image-number");

    const titulo =
        document.getElementById("about-image-title");

    if (
        !contenedor ||
        !botones.length
    ) {
        return;
    }

    /* ==========================================
       CREAR NAVEGACIÓN
    ========================================== */

    let navegacion =
        document.querySelector(
            ".about-mobile-navigation"
        );

    if (!navegacion) {

        navegacion =
            document.createElement("div");

        navegacion.className =
            "about-mobile-navigation";

        navegacion.innerHTML = `
            <button
                type="button"
                class="about-mobile-prev"
                aria-label="Anterior">
                ←
            </button>

            <span class="about-mobile-counter">
                01 / ${String(botones.length).padStart(2, "0")}
            </span>

            <button
                type="button"
                class="about-mobile-next"
                aria-label="Siguiente">
                →
            </button>
        `;

        contenedor.parentNode.appendChild(
            navegacion
        );
    }

    const anterior =
        navegacion.querySelector(
            ".about-mobile-prev"
        );

    const siguiente =
        navegacion.querySelector(
            ".about-mobile-next"
        );

    const contador =
        navegacion.querySelector(
            ".about-mobile-counter"
        );

    let indiceActual = 0;


    /* ==========================================
       MOSTRAR SELECCIÓN
    ========================================== */

    function mostrarSeleccion(indice) {

        if (indice < 0) {
            indice = botones.length - 1;
        }

        if (
            indice >= botones.length
        ) {
            indice = 0;
        }

        indiceActual = indice;

        const boton =
            botones[indice];

        botones.forEach(
            item => {
                item.classList.remove(
                    "active"
                );
            }
        );

        boton.classList.add(
            "active"
        );


        /* ======================================
           CAMBIAR FOTO
        ====================================== */

        const nuevaImagen =
            boton.dataset.image;

        if (
            imagen &&
            nuevaImagen
        ) {

            imagen.src =
                nuevaImagen;

        }


        /* ======================================
           CAMBIAR NÚMERO
        ====================================== */

        if (numero) {

            numero.textContent =
                boton.dataset.number ||
                String(indice + 1).padStart(2, "0");

        }


        /* ======================================
           CAMBIAR TÍTULO
        ====================================== */

        if (titulo) {

            titulo.textContent =
                boton.dataset.title ||
                "";

        }


        /* ======================================
           ACTUALIZAR CONTADOR
        ====================================== */

        if (contador) {

            contador.textContent =
                `${String(indice + 1).padStart(2, "0")} / ${String(botones.length).padStart(2, "0")}`;

        }


        /* ======================================
           MOVER LA TARJETA
        ====================================== */

        boton.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });

    }


    /* ==========================================
       BOTÓN ANTERIOR
    ========================================== */

    anterior.addEventListener(
        "click",
        () => {

            mostrarSeleccion(
                indiceActual - 1
            );

        }
    );


    /* ==========================================
       BOTÓN SIGUIENTE
    ========================================== */

    siguiente.addEventListener(
        "click",
        () => {

            mostrarSeleccion(
                indiceActual + 1
            );

        }
    );


    /* ==========================================
       CLICK EN CADA SELECCIÓN
    ========================================== */

    botones.forEach(
        (boton, indice) => {

            boton.addEventListener(
                "click",
                () => {

                    mostrarSeleccion(
                        indice
                    );

                }
            );

        }
    );


    /* ==========================================
       DETECTAR DESLIZAMIENTO EN CELULAR
    ========================================== */

    contenedor.addEventListener(
        "scroll",
        () => {

            if (
                window.innerWidth > 600
            ) {
                return;
            }

            const ancho =
                contenedor.clientWidth;

            if (!ancho) {
                return;
            }

            const nuevoIndice =
                Math.round(
                    contenedor.scrollLeft /
                    ancho
                );

            if (
                nuevoIndice !==
                indiceActual
            ) {

                indiceActual =
                    Math.max(
                        0,
                        Math.min(
                            nuevoIndice,
                            botones.length - 1
                        )
                    );

                const boton =
                    botones[indiceActual];

                botones.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                boton.classList.add(
                    "active"
                );

                if (
                    imagen &&
                    boton.dataset.image
                ) {

                    imagen.src =
                        boton.dataset.image;

                }

                if (numero) {

                    numero.textContent =
                        boton.dataset.number ||
                        String(
                            indiceActual + 1
                        ).padStart(
                            2,
                            "0"
                        );

                }

                if (titulo) {

                    titulo.textContent =
                        boton.dataset.title ||
                        "";

                }

                if (contador) {

                    contador.textContent =
                        `${String(indiceActual + 1).padStart(2, "0")} / ${String(botones.length).padStart(2, "0")}`;

                }

            }

        }
    );

}


/* =========================================================
   ACTIVAR NAVEGACIÓN DE NUESTRA EMPRESA
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            activarNavegacionEmpresaMovil,
            500
        );

    }
);


/* =========================================================
   CATEGORÍAS
========================================================= */

async function cargarCategorias() {

    const contenedor =
        document.querySelector(
            ".categories"
        );


    const listaProductos =
        document.getElementById(
            "product-list"
        );


    if (!contenedor) {

        return;

    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "villa_categorias"
            )
        );


    contenedor.innerHTML = "";


    if (
        snapshot.empty
    ) {

        contenedor.innerHTML = `

            <button
                class="category-card active"
                type="button">

                <span
                    class="category-number">

                    01

                </span>

                <strong>
                    Próximamente
                </strong>

                <small>
                    Ver productos
                </small>

            </button>

        `;


        if (listaProductos) {

            listaProductos.innerHTML = `

                <div class="product-list-header">

                    <span>
                        01
                    </span>

                    <h3>
                        Nuestro catálogo
                    </h3>

                </div>

                <p>
                    Próximamente tendremos productos disponibles.
                </p>

            `;

        }


        return;

    }


    let numero =
        1;


    const categoriasData = [];


    for (
        const categoria
        of snapshot.docs
    ) {

        const data =
            categoria.data();


        const plantasSnapshot =
            await getDocs(
                collection(
                    db,
                    "villa_categorias",
                    categoria.id,
                    "plantas"
                )
            );


        const plantas =
            plantasSnapshot.docs.map(
                planta => ({

                    id: planta.id,

                    ...planta.data()

                })
            );


        categoriasData.push({

            id:
                categoria.id,

            nombre:
                data.nombre ||
                "Categoría",

            plantas

        });


        const boton =
            document.createElement(
                "button"
            );


        boton.className =
            "category-card";


        if (
            numero === 1
        ) {

            boton.classList.add(
                "active"
            );

        }


        boton.type =
            "button";


        boton.innerHTML = `

            <span
                class="category-number">

                ${String(numero).padStart(2, "0")}

            </span>


            <strong>

                ${escapeHtml(
                    data.nombre ||
                    "Categoría"
                )}

            </strong>


            <small>
                Ver productos
            </small>

        `;


        boton.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".category-card"
                    )
                    .forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                boton.classList.add(
                    "active"
                );


                mostrarPlantas(
    categoriasData.find(
        item => item.id === categoria.id
    ),
    listaProductos
);

            }
        );


        contenedor.appendChild(
            boton
        );


        numero++;

    }


    /*
       Mostrar la primera categoría
       al cargar.
    */

    if (
        categoriasData.length &&
        listaProductos
    ) {

        mostrarPlantas(
            categoriasData[0],
            listaProductos
        );

    }


    iniciarCarruselCategorias();

}


/* =========================================================
   MOSTRAR PLANTAS
========================================================= */

function mostrarPlantas(
    categoria,
    contenedor
) {

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";


    /* ==========================================
       ENCABEZADO
    ========================================== */

    const header =
        document.createElement("div");

    header.className =
        "product-list-header";

    header.innerHTML = `
        <span>01</span>

        <h3>
            ${escapeHtml(
                categoria.nombre
            )}
        </h3>
    `;

    contenedor.appendChild(
        header
    );


    /* ==========================================
       SIN PRODUCTOS
    ========================================== */

    if (
        !categoria.plantas ||
        categoria.plantas.length === 0
    ) {

        const mensaje =
            document.createElement("p");

        mensaje.style.padding =
            "20px 0";

        mensaje.textContent =
            "Próximamente agregaremos plantas a esta categoría.";

        contenedor.appendChild(
            mensaje
        );

        return;
    }


    /* ==========================================
       PRIMERAS 4 PLANTAS
    ========================================== */

    const primeras =
        categoria.plantas.slice(0, 4);


    primeras.forEach(
        planta => {

            crearBotonProducto(
                planta,
                categoria.nombre,
                contenedor
            );

        }
    );


    /* ==========================================
       SI HAY MÁS DE 4
    ========================================== */

    if (
        categoria.plantas.length > 4
    ) {

        const verMas =
            document.createElement("button");

        verMas.type =
            "button";

        verMas.className =
            "product-name ver-mas-productos";

        verMas.innerHTML = `
            <span>Ver más</span>
            <span>→</span>
        `;


        /* ======================================
           GUARDAR LOS PRODUCTOS EXTRA
        ====================================== */

        const productosExtra = [];

        let expandido = false;


        /* ======================================
           CLICK VER MÁS / VER MENOS
        ====================================== */

        verMas.addEventListener(
            "click",
            () => {

                /* ==================================
                   VER MÁS
                ================================== */

                if (!expandido) {

                    const restantes =
                        categoria.plantas.slice(4);


                    restantes.forEach(
                        planta => {

                            const cantidadAntes =
                                contenedor.children.length;

                            crearBotonProducto(
                                planta,
                                categoria.nombre,
                                contenedor
                            );


                            /*
                             * El botón recién creado
                             * es el último elemento.
                             */
                            const nuevoProducto =
                                contenedor.children[
                                    contenedor.children.length - 1
                                ];


                            /*
                             * Guardamos referencia
                             * para poder eliminarlo
                             * después.
                             */
                            productosExtra.push(
                                nuevoProducto
                            );


                            /*
                             * IMPORTANTE:
                             * mover el producto ANTES
                             * del botón Ver menos.
                             */
                            contenedor.insertBefore(
                                nuevoProducto,
                                verMas
                            );

                        }
                    );


                    verMas.innerHTML = `
                        <span>Ver menos</span>
                        <span>↑</span>
                    `;

                    expandido = true;

                }


                /* ==================================
                   VER MENOS
                ================================== */

                else {

                    productosExtra.forEach(
                        producto => {

                            if (
                                producto &&
                                producto.parentNode === contenedor
                            ) {

                                producto.remove();

                            }

                        }
                    );


                    productosExtra.length = 0;


                    verMas.innerHTML = `
                        <span>Ver más</span>
                        <span>→</span>
                    `;

                    expandido = false;

                }

            }
        );


        /* ==========================================
           BOTÓN SIEMPRE AL FINAL
        ========================================== */

        contenedor.appendChild(
            verMas
        );

    }

}


/* ==========================================
   CREAR BOTÓN DE PRODUCTO
========================================== */

function crearBotonProducto(
    planta,
    categoriaNombre,
    contenedor
) {

    const boton =
        document.createElement("button");

    boton.className =
        "product-name";

    boton.type =
        "button";

    boton.innerHTML = `
        ${escapeHtml(
            planta.nombre ||
            "Planta"
        )}

        <span>
            ›
        </span>
    `;


    boton.addEventListener(
        "click",
        () => {

            abrirModalPlanta(
                planta,
                categoriaNombre
            );

        }
    );


    contenedor.appendChild(
        boton
    );

}

/* =========================================================
   MODAL DE PLANTA
========================================================= */

function abrirModalPlanta(
    planta,
    categoria
) {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {

        return;

    }


    const imagen =
        document.getElementById(
            "modalProductImage"
        );


    const categoriaTexto =
        document.getElementById(
            "modalProductCategory"
        );


    const nombre =
        document.getElementById(
            "modalProductName"
        );


    const cientifico =
        document.getElementById(
            "modalProductScientific"
        );


    const descripcion =
        document.getElementById(
            "modalProductDescription"
        );


    if (imagen) {

        imagen.src =
            planta.imagen ||
            "";

        imagen.alt =
            planta.nombre ||
            "Planta";

    }


    if (categoriaTexto) {

        categoriaTexto.textContent =
            categoria.toUpperCase();

    }


    if (nombre) {

        nombre.textContent =
            planta.nombre ||
            "Planta";

    }


    if (cientifico) {

        cientifico.textContent =
            "Planta seleccionada";

    }


    if (descripcion) {

        descripcion.textContent =
            "Planta seleccionada de Villa Flor del Perú, preparada y presentada cuidadosamente.";

    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


function cerrarModalPlanta() {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   CERRAR MODAL
========================================================= */

const modalClose =
    document.getElementById(
        "productModalClose"
    );


if (modalClose) {

    modalClose.addEventListener(
        "click",
        cerrarModalPlanta
    );

}


const modalOverlay =
    document.querySelector(
        ".product-modal-overlay"
    );


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        cerrarModalPlanta
    );

}
/* =========================================================
CARRUSEL CATEGORÍAS
========================================================= */

function iniciarCarruselCategorias() {

    const contenedor =
        document.querySelector(".categories");

    const prev =
        document.querySelector(".category-prev");

    const next =
        document.querySelector(".category-next");

    if (!contenedor) return;

    let indice = 0;

    function visibles() {

        if (window.innerWidth <= 700) {
            return 1;
        }

        if (window.innerWidth <= 1100) {
            return 3;
        }

        return 5;
    }

    function actualizar() {

        const items =
            contenedor.querySelectorAll(
                ".category-card"
            );

        const visible = visibles();

        const max =
            Math.max(
                0,
                items.length - visible
            );

        if (indice > max) {
            indice = max;
        }

        /* ==========================================
           CELULAR
           Usamos scrollLeft, NO transform.
           ========================================== */

        if (window.innerWidth <= 700) {

            const ancho =
                contenedor.clientWidth;

            contenedor.scrollTo({
                left: indice * ancho,
                behavior: "smooth"
            });

        }

        /* ==========================================
           PC / TABLET
           ========================================== */

        else {

            const ancho =
                contenedor.clientWidth / visible;

            const gap = 16;

            contenedor.scrollTo({
                left:
                    indice *
                    (ancho + gap),
                behavior: "smooth"
            });

        }

        if (prev) {
            prev.disabled =
                indice === 0;
        }

        if (next) {
            next.disabled =
                indice >= max;
        }
    }

    /* ==========================================
       BOTÓN ANTERIOR
       ========================================== */

    if (prev) {

        prev.onclick = () => {

            if (indice > 0) {

                indice--;

                const items =
                    contenedor.querySelectorAll(
                        ".category-card"
                    );

                if (items[indice]) {
                    items[indice].click();
                }

                actualizar();
            }
        };
    }

    /* ==========================================
       BOTÓN SIGUIENTE
       ========================================== */

    if (next) {

        next.onclick = () => {

            const items =
                contenedor.querySelectorAll(
                    ".category-card"
                );

            const max =
                Math.max(
                    0,
                    items.length - visibles()
                );

            if (indice < max) {

                indice++;

                if (items[indice]) {
                    items[indice].click();
                }

                actualizar();
            }
        };
    }

    /* ==========================================
       SI EL USUARIO DESLIZA CON EL DEDO
       ========================================== */

    contenedor.addEventListener(
        "scroll",
        () => {

            if (window.innerWidth > 700) {
                return;
            }

            const ancho =
                contenedor.clientWidth;

            if (!ancho) return;

            indice =
                Math.round(
                    contenedor.scrollLeft /
                    ancho
                );

            const items =
                contenedor.querySelectorAll(
                    ".category-card"
                );

            items.forEach(
                item => {
                    item.classList.remove(
                        "active"
                    );
                }
            );

            if (items[indice]) {

                items[indice].classList.add(
                    "active"
                );
            }

            if (prev) {
                prev.disabled =
                    indice === 0;
            }

            if (next) {

                const max =
                    Math.max(
                        0,
                        items.length - 1
                    );

                next.disabled =
                    indice >= max;
            }

        }
    );

    window.addEventListener(
        "resize",
        actualizar
    );

    actualizar();
}

/* =========================================================
   NOSOTROS - ESTADO VISUAL
========================================================= */

function iniciarNosotros() {

    const botones =
        document.querySelectorAll(
            ".about-value"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    boton.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function iniciarNavegacion() {

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    links.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   CONTACTO
========================================================= */

function iniciarContacto() {

    const formulario =
        document.getElementById(
            "contact-form"
        );


    if (!formulario) {

        return;

    }


    formulario.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            alert(
                "Gracias por contactarnos. Pronto nos comunicaremos contigo."
            );


            formulario.reset();

        }
    );

}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapeHtml(text) {

    if (!text) {

        return "";

    }


    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}