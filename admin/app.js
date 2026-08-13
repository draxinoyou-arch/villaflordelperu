/* =====================================================
   VILLA FLOR DEL PERÚ
   PANEL ADMINISTRATIVO
===================================================== */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    setDoc
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBJGg6noIYaNImmM7VDYD58WhkRTqh8q2M",
    authDomain: "villa-flor-del-peru.firebaseapp.com",
    projectId: "villa-flor-del-peru",
    storageBucket: "villa-flor-del-peru.firebasestorage.app",
    messagingSenderId: "979987696824",
    appId: "1:979987696824:web:4efcf348ca1ded2929384d"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =====================================================
   CLOUDINARY
===================================================== */

const CLOUD_NAME = "fhkugeoo";

const UPLOAD_PRESET = "villa-flor";


/* =====================================================
   ELEMENTOS
===================================================== */

const loginScreen =
    document.getElementById("loginScreen");

const adminPanel =
    document.getElementById("adminPanel");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const loginButton =
    document.getElementById("loginButton");

const adminEmail =
    document.getElementById("adminEmail");


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    loginError.textContent = "";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    loginButton.disabled = true;

    loginButton.innerHTML = `
        <span>Ingresando...</span>
        <i class="fa-solid fa-spinner fa-spin"></i>
    `;


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        loginError.textContent =
            "Correo o contraseña incorrectos.";

        loginButton.disabled = false;

        loginButton.innerHTML = `
            <span>Ingresar al panel</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    }

});


/* =====================================================
   MOSTRAR CONTRASEÑA
===================================================== */

document
    .getElementById("showPassword")
    .addEventListener("click", () => {

        const input =
            document.getElementById("password");

        const icon =
            document.querySelector(
                "#showPassword i"
            );


        if (input.type === "password") {

            input.type = "text";

            icon.className =
                "fa-regular fa-eye-slash";

        } else {

            input.type = "password";

            icon.className =
                "fa-regular fa-eye";

        }

    });


/* =====================================================
   ESTADO DE SESIÓN
===================================================== */

onAuthStateChanged(auth, async (user) => {

    if (user) {

        loginScreen.classList.add("hidden");

        adminPanel.classList.remove("hidden");

        adminEmail.textContent =
            user.email || "Administrador";

        await cargarTodo();

    } else {

        adminPanel.classList.add("hidden");

        loginScreen.classList.remove("hidden");

    }

});


/* =====================================================
   CERRAR SESIÓN
===================================================== */

document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {

        await signOut(auth);

    });


/* =====================================================
   NAVEGACIÓN
===================================================== */

const menuItems =
    document.querySelectorAll(".menu-item");

const sections = {

    inicio:
        document.getElementById("section-inicio"),

    destacados:
        document.getElementById("section-destacados"),

    empresa:
        document.getElementById("section-empresa"),

    categorias:
        document.getElementById("section-categorias")

};


const pageTitle =
    document.getElementById("pageTitle");


const titles = {

    inicio:
        "Panel principal",

    destacados:
        "Productos destacados",

    empresa:
        "Nuestra empresa",

    categorias:
        "Categorías y plantas"

};


menuItems.forEach(button => {

    button.addEventListener("click", () => {

        const section =
            button.dataset.section;


        menuItems.forEach(item => {

            item.classList.remove("active");

        });


        button.classList.add("active");


        Object.values(sections).forEach(item => {

            item.classList.remove(
                "active-section"
            );

        });


        sections[section]
            .classList.add(
                "active-section"
            );


        pageTitle.textContent =
            titles[section];


        document
            .getElementById("sidebar")
            .classList.remove("show");

    });

});


/* =====================================================
   MENÚ MÓVIL
===================================================== */

document
    .getElementById("menuButton")
    .addEventListener("click", () => {

        document
            .getElementById("sidebar")
            .classList.toggle("show");

    });


/* =====================================================
   MODALES
===================================================== */

function abrirModal(id) {

    document
        .getElementById(id)
        .classList.remove("hidden");

}


function cerrarModal(id) {

    document
        .getElementById(id)
        .classList.add("hidden");

}


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener("click", () => {

            cerrarModal(
                button.dataset.close
            );

        });

    });


document
    .querySelectorAll(".modal-overlay")
    .forEach(modal => {

        modal.addEventListener("click", (e) => {

            if (e.target === modal) {

                modal.classList.add("hidden");

            }

        });

    });


/* =====================================================
   TOAST
===================================================== */

function mostrarToast(message) {

    const toast =
        document.getElementById("toast");

    const text =
        document.getElementById("toastMessage");


    text.textContent = message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


/* =====================================================
   SUBIR IMAGEN A CLOUDINARY
===================================================== */

async function subirImagen(file) {

    if (!file) {

        return "";

    }


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    const response =
        await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


    const result =
        await response.json();


    if (!result.secure_url) {

        throw new Error(
            "No se pudo subir la imagen."
        );

    }


    return result.secure_url;

}


/* =====================================================
   CARGAR TODO
===================================================== */

async function cargarTodo() {

    try {

        await Promise.all([

            cargarDestacados(),

            cargarEmpresa(),

            cargarCategorias(),

            cargarEstadisticas()

        ]);

    } catch (error) {

        console.error(
            "Error cargando panel:",
            error
        );

    }

}


/* =====================================================
   DESTACADOS
===================================================== */

const destacadosList =
    document.getElementById(
        "destacadosList"
    );


document
    .getElementById("newDestacadoButton")
    .addEventListener("click", () => {

        document
            .getElementById(
                "destacadoForm"
            )
            .reset();

        document
            .getElementById(
                "destacadoId"
            )
            .value = "";

        document
            .getElementById(
                "destacadoModalTitle"
            )
            .textContent =
            "Agregar producto";


        document
            .getElementById(
                "destacadoPreview"
            )
            .classList.add(
                "hidden"
            );


        abrirModal(
            "destacadoModal"
        );

    });


async function cargarDestacados() {

    destacadosList.innerHTML = "";


    const snapshot =
        await getDocs(
            collection(
                db,
                "villa_destacados"
            )
        );


    if (snapshot.empty) {

        destacadosList.innerHTML = `

            <div class="empty-message">

                <i class="fa-solid fa-star"></i>

                <p>
                    Todavía no hay productos destacados.
                </p>

            </div>

        `;

        return;

    }


    snapshot.forEach(item => {

        const data =
            item.data();


        destacadosList.innerHTML += `

            <article class="product-card">

                <div class="product-card-image">

                    <img
                        src="${escapeHtml(data.imagen || "")}"
                        alt="${escapeHtml(data.nombre || "")}"
                    >

                </div>


                <div class="product-card-content">

                    <span>
                        PRODUCTO DESTACADO
                    </span>

                    <h3>
                        ${escapeHtml(data.nombre || "")}
                    </h3>


                    <div class="card-actions">

                        <button
                            class="card-action delete-action"
                            onclick="eliminarDestacado('${item.id}')">

                            <i class="fa-solid fa-trash"></i>

                            Eliminar

                        </button>

                    </div>

                </div>

            </article>

        `;

    });

}


document
    .getElementById("destacadoForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();


        const nombre =
            document
                .getElementById(
                    "destacadoNombre"
                )
                .value
                .trim();


        const file =
            document
                .getElementById(
                    "destacadoFile"
                )
                .files[0];


        if (!nombre) {

            return;

        }


        if (!file) {

            alert(
                "Selecciona una fotografía."
            );

            return;

        }


        const button =
            e.target.querySelector(
                "button[type='submit']"
            );


        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Subiendo...
        `;


        try {

            const imagen =
                await subirImagen(
                    file
                );


            await addDoc(
                collection(
                    db,
                    "villa_destacados"
                ),
                {

                    nombre,

                    imagen,

                    creado:
                        Date.now()

                }
            );


            cerrarModal(
                "destacadoModal"
            );


            mostrarToast(
                "Producto agregado correctamente."
            );


            await cargarDestacados();

            await cargarEstadisticas();


        } catch (error) {

            console.error(error);

            alert(
                "No se pudo guardar el producto."
            );

        }


        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Guardar producto
        `;

    });


window.eliminarDestacado =
    async function(id) {

        if (
            !confirm(
                "¿Quieres eliminar este producto destacado?"
            )
        ) {

            return;

        }


        await deleteDoc(
            doc(
                db,
                "villa_destacados",
                id
            )
        );


        mostrarToast(
            "Producto eliminado."
        );


        await cargarDestacados();

        await cargarEstadisticas();

    };


/* =====================================================
   PREVIEW DESTACADO
===================================================== */

document
    .getElementById("destacadoFile")
    .addEventListener("change", (e) => {

        mostrarPreview(
            e.target.files[0],
            "destacadoPreview"
        );

    });


/* =====================================================
   EMPRESA
===================================================== */

const empresaKeys = [

    "calidad",

    "seleccion",

    "proyeccion"

];


async function cargarEmpresa() {

    for (const key of empresaKeys) {

        const reference =
            doc(
                db,
                "villa_empresa",
                key
            );


        const snapshot =
            await getDoc(
                reference
            );


        if (!snapshot.exists()) {

            continue;

        }


        const data =
            snapshot.data();


        mostrarImagenEmpresa(
            key,
            data.imagen
        );

    }

}


function mostrarImagenEmpresa(
    key,
    url
) {

    const image =
        document.getElementById(
            `empresaImage${capitalizar(key)}`
        );


    const placeholder =
        document.getElementById(
            `empresaPlaceholder${capitalizar(key)}`
        );


    if (!image || !placeholder) {

        return;

    }


    if (url) {

        image.src = url;

        image.classList.add(
            "loaded"
        );

        placeholder.style.display =
            "none";

    }

}


document
    .getElementById(
        "empresaFileCalidad"
    )
    .addEventListener(
        "change",
        () => guardarEmpresa(
            "calidad",
            "empresaFileCalidad"
        )
    );


document
    .getElementById(
        "empresaFileSeleccion"
    )
    .addEventListener(
        "change",
        () => guardarEmpresa(
            "seleccion",
            "empresaFileSeleccion"
        )
    );


document
    .getElementById(
        "empresaFileProyeccion"
    )
    .addEventListener(
        "change",
        () => guardarEmpresa(
            "proyeccion",
            "empresaFileProyeccion"
        )
    );


async function guardarEmpresa(
    key,
    inputId
) {

    const input =
        document.getElementById(
            inputId
        );


    const file =
        input.files[0];


    if (!file) {

        return;

    }


    try {

        mostrarToast(
            "Subiendo imagen..."
        );


        const imagen =
            await subirImagen(
                file
            );


        await updateDoc(
            doc(
                db,
                "villa_empresa",
                key
            ),
            {

                imagen,

                actualizado:
                    Date.now()

            }
        ).catch(
            async () => {

                await addDoc(
                    collection(
                        db,
                        "villa_empresa"
                    ),
                    {

                        key,

                        imagen,

                        actualizado:
                            Date.now()

                    }
                );

            }
        );


        /*
           Debido a que updateDoc necesita
           que exista el documento, usamos
           setDoc en la función auxiliar
           de abajo.
        */

        await guardarEmpresaDocumento(
            key,
            imagen
        );


        mostrarImagenEmpresa(
            key,
            imagen
        );


        mostrarToast(
            "Imagen actualizada."
        );


        input.value = "";


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo guardar la imagen."
        );

    }

}


/* =====================================================
   GUARDAR DOCUMENTO EMPRESA
===================================================== */


async function guardarEmpresaDocumento(
    key,
    imagen
) {

    await setDoc(
        doc(
            db,
            "villa_empresa",
            key
        ),
        {

            key,

            imagen,

            actualizado:
                Date.now()

        }
    );

}


/* =====================================================
   CATEGORÍAS
===================================================== */

const categoriasList =
    document.getElementById(
        "categoriasList"
    );


document
    .getElementById(
        "newCategoriaButton"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "categoriaForm"
                )
                .reset();

            abrirModal(
                "categoriaModal"
            );

        }
    );


async function cargarCategorias() {

    categoriasList.innerHTML = "";


    const snapshot =
        await getDocs(
            collection(
                db,
                "villa_categorias"
            )
        );


    if (snapshot.empty) {

        categoriasList.innerHTML = `

            <div class="empty-message">

                <i class="fa-solid fa-layer-group"></i>

                <p>
                    Todavía no hay categorías.
                </p>

            </div>

        `;

        return;

    }


    let numero = 1;


    for (const item of snapshot.docs) {

        const data =
            item.data();


        const plantas =
            await getDocs(
                collection(
                    db,
                    "villa_categorias",
                    item.id,
                    "plantas"
                )
            );


        let plantasHTML = "";


        if (plantas.empty) {

            plantasHTML = `

                <div class="empty-message">

                    <i class="fa-solid fa-seedling"></i>

                    <p>
                        Esta categoría todavía no tiene plantas.
                    </p>

                </div>

            `;

        } else {

            plantas.forEach(
                planta => {

                    const p =
                        planta.data();


                    plantasHTML += `

                        <div class="plant-card">

                            <div class="plant-image">

                                <img
                                    src="${escapeHtml(p.imagen || "")}"
                                    alt="${escapeHtml(p.nombre || "")}"
                                >

                            </div>


                            <div class="plant-content">

                                <h4>
                                    ${escapeHtml(p.nombre || "")}
                                </h4>


                                <button
                                    class="plant-delete"
                                    onclick="eliminarPlanta(
                                        '${item.id}',
                                        '${planta.id}'
                                    )">

                                    <i class="fa-solid fa-trash"></i>

                                    Eliminar

                                </button>

                            </div>

                        </div>

                    `;

                }
            );

        }


        categoriasList.innerHTML += `

            <article class="category-card">

                <div class="category-header">

                    <div class="category-info">

                        <div class="category-number">
                            ${String(numero).padStart(2,"0")}
                        </div>

                        <div>

                            <h3>
                                ${escapeHtml(data.nombre || "")}
                            </h3>

                            <small>
                                ${plantas.size} planta(s)
                            </small>

                        </div>

                    </div>


                    <div class="category-actions">

                        <button
                            class="small-button add-plant-button"
                            onclick="abrirPlanta('${item.id}')">

                            <i class="fa-solid fa-plus"></i>

                            Agregar planta

                        </button>


                        <button
                            class="small-button category-delete"
                            onclick="eliminarCategoria('${item.id}')">

                            <i class="fa-solid fa-trash"></i>

                            Eliminar

                        </button>

                    </div>

                </div>


                <div class="plants-grid">

                    ${plantasHTML}

                </div>

            </article>

        `;


        numero++;

    }

}


/* =====================================================
   CREAR CATEGORÍA
===================================================== */

document
    .getElementById(
        "categoriaForm"
    )
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const nombre =
                document
                    .getElementById(
                        "categoriaNombre"
                    )
                    .value
                    .trim();


            if (!nombre) {

                return;

            }


            await addDoc(
                collection(
                    db,
                    "villa_categorias"
                ),
                {

                    nombre,

                    creado:
                        Date.now()

                }
            );


            cerrarModal(
                "categoriaModal"
            );


            mostrarToast(
                "Categoría creada."
            );


            await cargarCategorias();

            await cargarEstadisticas();

        }
    );


/* =====================================================
   ELIMINAR CATEGORÍA
===================================================== */

window.eliminarCategoria =
    async function(id) {

        if (
            !confirm(
                "¿Eliminar esta categoría y sus plantas?"
            )
        ) {

            return;

        }


        const plantas =
            await getDocs(
                collection(
                    db,
                    "villa_categorias",
                    id,
                    "plantas"
                )
            );


        for (
            const planta of plantas.docs
        ) {

            await deleteDoc(
                doc(
                    db,
                    "villa_categorias",
                    id,
                    "plantas",
                    planta.id
                )
            );

        }


        await deleteDoc(
            doc(
                db,
                "villa_categorias",
                id
            )
        );


        mostrarToast(
            "Categoría eliminada."
        );


        await cargarCategorias();

        await cargarEstadisticas();

    };


/* =====================================================
   ABRIR PLANTA
===================================================== */

window.abrirPlanta =
    function(categoriaId) {

        document
            .getElementById(
                "plantaForm"
            )
            .reset();


        document
            .getElementById(
                "plantaCategoriaId"
            )
            .value =
            categoriaId;


        document
            .getElementById(
                "plantaPreview"
            )
            .classList.add(
                "hidden"
            );


        abrirModal(
            "plantaModal"
        );

    };


/* =====================================================
   CREAR PLANTA
===================================================== */

document
    .getElementById(
        "plantaForm"
    )
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const categoriaId =
                document
                    .getElementById(
                        "plantaCategoriaId"
                    )
                    .value;


            const nombre =
                document
                    .getElementById(
                        "plantaNombre"
                    )
                    .value
                    .trim();


            const file =
                document
                    .getElementById(
                        "plantaFile"
                    )
                    .files[0];


            if (!nombre || !file) {

                alert(
                    "Completa el nombre y selecciona una imagen."
                );

                return;

            }


            const button =
                e.target.querySelector(
                    "button[type='submit']"
                );


            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Subiendo...
            `;


            try {

                const imagen =
                    await subirImagen(
                        file
                    );


                await addDoc(
                    collection(
                        db,
                        "villa_categorias",
                        categoriaId,
                        "plantas"
                    ),
                    {

                        nombre,

                        imagen,

                        creado:
                            Date.now()

                    }
                );


                cerrarModal(
                    "plantaModal"
                );


                mostrarToast(
                    "Planta agregada."
                );


                await cargarCategorias();

                await cargarEstadisticas();


            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo guardar la planta."
                );

            }


            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Guardar planta
            `;

        }
    );


/* =====================================================
   ELIMINAR PLANTA
===================================================== */

window.eliminarPlanta =
    async function(
        categoriaId,
        plantaId
    ) {

        if (
            !confirm(
                "¿Eliminar esta planta?"
            )
        ) {

            return;

        }


        await deleteDoc(
            doc(
                db,
                "villa_categorias",
                categoriaId,
                "plantas",
                plantaId
            )
        );


        mostrarToast(
            "Planta eliminada."
        );


        await cargarCategorias();

        await cargarEstadisticas();

    };


/* =====================================================
   PREVIEW PLANTA
===================================================== */

document
    .getElementById(
        "plantaFile"
    )
    .addEventListener(
        "change",
        (e) => {

            mostrarPreview(
                e.target.files[0],
                "plantaPreview"
            );

        }
    );


function mostrarPreview(
    file,
    containerId
) {

    if (!file) {

        return;

    }


    const container =
        document.getElementById(
            containerId
        );


    const img =
        container.querySelector(
            "img"
        );


    img.src =
        URL.createObjectURL(
            file
        );


    container.classList.remove(
        "hidden"
    );

}


/* =====================================================
   ESTADÍSTICAS
===================================================== */

async function cargarEstadisticas() {

    try {

        const destacados =
            await getDocs(
                collection(
                    db,
                    "villa_destacados"
                )
            );


        const empresa =
            await getDocs(
                collection(
                    db,
                    "villa_empresa"
                )
            );


        const categorias =
            await getDocs(
                collection(
                    db,
                    "villa_categorias"
                )
            );


        let plantasTotal = 0;


        for (
            const categoria
            of categorias.docs
        ) {

            const plantas =
                await getDocs(
                    collection(
                        db,
                        "villa_categorias",
                        categoria.id,
                        "plantas"
                    )
                );


            plantasTotal +=
                plantas.size;

        }


        document
            .getElementById(
                "totalDestacados"
            )
            .textContent =
            destacados.size;


        document
            .getElementById(
                "totalEmpresa"
            )
            .textContent =
            empresa.size;


        document
            .getElementById(
                "totalCategorias"
            )
            .textContent =
            categorias.size;


        document
            .getElementById(
                "totalPlantas"
            )
            .textContent =
            plantasTotal;


    } catch (error) {

        console.error(
            "Error estadísticas:",
            error
        );

    }

}


/* =====================================================
   UTILIDADES
===================================================== */

function capitalizar(texto) {

    return texto
        .charAt(0)
        .toUpperCase() +
        texto.slice(1);

}


function escapeHtml(text) {

    if (!text) {

        return "";

    }


    return text

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}