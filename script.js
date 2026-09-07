let currentStream = null;
let userPoints = 80;
let currentSelectedTeamKey = 'alg';

// ============================================================
// AUTOMATIZACIÓN DEL CARRUSEL DE NOTICIAS
// ============================================================

let currentNewsIndex = 0;

function showSlide(index) {
  const slides = document.querySelectorAll('.news-slide');
  const dots = document.querySelectorAll('.dot');

  if (!slides.length) return;

  if (index >= slides.length) currentNewsIndex = 0;
  if (index < 0) currentNewsIndex = slides.length - 1;

  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));

  slides[currentNewsIndex].classList.add('active');

  if (dots[currentNewsIndex]) {
    dots[currentNewsIndex].classList.add('active');
  }
}

function currentSlide(index) {
  currentNewsIndex = index;
  showSlide(currentNewsIndex);
}

setInterval(() => {
  currentNewsIndex++;
  showSlide(currentNewsIndex);
}, 4000);


// ============================================================
// MODAL DE HISTORIA DE BÉISBOL
// ============================================================

function openHistoryModal() {
  document.getElementById('history-modal').classList.remove('hidden');
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.add('hidden');
}


// ============================================================
// BASE DE DATOS DE EQUIPOS
// ============================================================

const teamsData = {

  alg: {
    name: 'Algodoneros de Guasave',
    tag: 'ALG',
    tagClass: 'tag-cul',
    city: 'Guasave, Sinaloa',
    stadium: 'Estadio Kuroda Park',
    capacity: '8,000 espectadores',
    titles: '1 Título de Liga',
    founded: '1970',
    nickname: 'La Furia Algodonera',
    manager: 'Oswaldo Morejón (Manager)',

    roster: [
      {
        name: 'Jesse Castillo',
        role: 'Infielder',
        img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Equipo tradicional con una afición muy entregada en el estado de Sinaloa.'
  },


  cal: {
    name: 'Calientes de Durango',
    tag: 'CAL',
    tagClass: 'tag-her',
    city: 'Durango, Durango',
    stadium: 'Estadio Francisco Villa',
    capacity: '5,000 espectadores',
    titles: 'En desarrollo',
    founded: '2024',
    nickname: 'La Tropa de Durango',
    manager: 'Enrique Reyes (Manager)',

    roster: [
      {
        name: 'Ademar Rifaela',
        role: 'Jardinero',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Franquicia vibrante que aporta gran energía y pasión al circuito norteño.'
  },


  cha: {
    name: 'Charros de Jalisco',
    tag: 'CHA',
    tagClass: 'tag-obr',
    city: 'Zapopan, Jalisco',
    stadium: 'Estadio Panamericano',
    capacity: '16,500 espectadores',
    titles: '2 Títulos de Liga',
    founded: '1949',
    nickname: 'La Escuadra Albiazul',
    manager: 'Benjamín Gil (Manager)',

    roster: [
      {
        name: 'Japhet Amador',
        role: 'Bateador Designado',
        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Equipo con gran tradición histórica en el occidente de México.'
  },


  dor: {
    name: 'Dorados de Chihuahua',
    tag: 'DOR',
    tagClass: 'tag-nav',
    city: 'Chihuahua, Chihuahua',
    stadium: 'Estadio Monumental Chihuahua',
    capacity: '14,500 espectadores',
    titles: 'Competitivo',
    founded: '1936',
    nickname: 'La División del Norte',
    manager: 'Gerardo Álvarez (Manager)',

    roster: [
      {
        name: 'Sebastián Elizalde',
        role: 'Jardinero',
        img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Representantes con arraigo e historia profunda en el estado grande.'
  },


  // ==========================================================
  // ACEREROS DE MONCLOVA
  // ==========================================================

  ace: {
    name: 'Acereros de Monclova',
    tag: 'ACE',
    tagClass: 'tag-cul',
    city: 'Monclova, Coahuila',
    stadium: 'Estadio Monclova',
    capacity: '8,500 espectadores',
    titles: '1 Título de Liga',
    founded: '1974',
    nickname: 'La Furia Azul',
    manager: 'Matías Carrillo (Manager)',

    roster: [
      {
        name: 'Chris Carter',
        role: 'Bateador de Poder',
        img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Una de las ofensivas más poderosas de la zona norte del país.'
  },


  rie: {
    name: 'Rieleros de Aguascalientes',
    tag: 'RIE',
    tagClass: 'tag-nav',
    city: 'Aguascalientes, Aguascalientes',
    stadium: 'Estadio Alberto Romo Chávez',
    capacity: '6,500 espectadores',
    titles: '1 Título de Liga',
    founded: '1975',
    nickname: 'La Máquina Rielera',
    manager: 'Alfonso Jiménez (Manager)',

    roster: [
      {
        name: 'Leonardo Reginatto',
        role: 'Infielder',
        img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Equipo tradicional con memorables batallas en el diamante nacional.'
  },


  tec: {
    name: 'Tecos de los Dos Laredos',
    tag: 'TEC',
    tagClass: 'tag-her',
    city: 'Nuevo Laredo / Laredo',
    stadium: 'Parque La Junta / Uni-Trade Stadium',
    capacity: '8,000 espectadores',
    titles: '5 Títulos de Liga',
    founded: '1940',
    nickname: 'Los Dos Laredos',
    manager: 'Félix Fermín (Manager)',

    roster: [
      {
        name: 'Kennys Vargas',
        role: 'Primera Base',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Franquicia binacional con una larga y respetada trayectoria histórica.'
  },


  tor: {
    name: 'Toros de Tijuana',
    tag: 'TOR',
    tagClass: 'tag-obr',
    city: 'Tijuana, Baja California',
    stadium: 'Estadio Gasmart (Chevron)',
    capacity: '17,000 espectadores',
    titles: '2 Títulos de Liga',
    founded: '2004',
    nickname: 'El Astado',
    manager: 'Luís Carlos Rivera (Manager)',

    roster: [
      {
        name: 'Nick Williams',
        role: 'Jardinero',
        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Organización moderna y protagonista constante en los campeonatos.'
  },


  soc: {
    name: 'Saraperos de Saltillo',
    tag: 'SOC',
    tagClass: 'tag-cul',
    city: 'Saltillo, Coahuila',
    stadium: 'Estadio Francisco I. Madero',
    capacity: '14,000 espectadores',
    titles: '3 Títulos de Liga',
    founded: '1970',
    nickname: 'La Nave Verde',
    manager: 'Mark Weidemaier (Manager)',

    roster: [
      {
        name: 'Rainel Rosario',
        role: 'Jardinero',
        img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'Tradición y orgullo del estado de Coahuila con una afición muy fiel.'
  },


  sul: {
    name: 'Sultanes de Monterrey',
    tag: 'SUL',
    tagClass: 'tag-her',
    city: 'Monterrey, Nuevo León',
    stadium: 'Estadio Mobil Super',
    capacity: '22,000 espectadores',
    titles: '10 Títulos de Liga',
    founded: '1939',
    nickname: 'Los Muchizos del Regreso / Fantasmas Grises',
    manager: 'Roberto Kelly (Manager)',

    roster: [
      {
        name: 'Ramiro Peña',
        role: 'Infielder',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      }
    ],

    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',

    gallery: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'
    ],

    desc: 'El equipo histórico de Monterrey, pilar fundamental de la pelota profesional.'
  }

};


// ============================================================
// TRIVIA
// ============================================================

const triviaQuestions = [
  {
    q: '¿Cuántos strikes equivalen a un out (ponche) en el béisbol?',
    options: ['2 strikes', '3 strikes', '4 strikes', '5 strikes'],
    correct: 1
  },
  {
    q: '¿Cuántos jugadores defensivos están en el campo al mismo tiempo?',
    options: ['9 jugadores', '10 jugadores', '11 jugadores', '8 jugadores'],
    correct: 0
  },
  {
    q: '¿Cómo se llama cuando un bateador bota la pelota fuera del estadio?',
    options: ['Foul', 'Single', 'Home Run', 'Bunt'],
    correct: 2
  },
  {
    q: '¿Qué posición ocupa el jugador que se coloca detrás del plato de bateo?',
    options: ['Pitcher', 'Catcher / Receptor', 'Shortstop', 'Jardinero Central'],
    correct: 1
  },
  {
    q: '¿Cuántas bases hay en el diamante de béisbol sin contar el Home Plate?',
    options: ['2 bases', '3 bases', '4 bases', '5 bases'],
    correct: 1
  }
];

let currentQuestionIndex = 0;
let triviaScore = 0;
let correctCount = 0;
let triviaTimer = null;
let timeLeft = 20;


// ============================================================
// PUNTOS
// ============================================================

function updatePointsDisplay() {
  document.querySelectorAll('.user-pts-display').forEach(el => {
    el.textContent = userPoints;
  });
}


// ============================================================
// AUTENTICACIÓN
// ============================================================

function switchAuthScreen(targetScreenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });

  document.getElementById(targetScreenId).classList.add('active');
}

function navigateToApp(defaultTabId) {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('register-screen').classList.remove('active');
  document.getElementById('app-content').classList.remove('hidden');

  switchTab(
    defaultTabId,
    document.querySelector('.tab-btn')
  );

  updatePointsDisplay();
}


// ============================================================
// NAVEGACIÓN
// ============================================================

function switchTab(tabId, element) {

  document.querySelectorAll('.tab-screen').forEach(s => {
    s.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
  });

  const target = document.getElementById(tabId);

  if (target) {
    target.classList.add('active');
  }

  if (element) {
    element.classList.add('active');
  }
}


// ============================================================
// DETALLE DEL EQUIPO
// ============================================================

function openTeamDetail(teamKey) {

  currentSelectedTeamKey = teamKey || 'alg';

  const team = teamsData[currentSelectedTeamKey];

  if (!team) return;


  const tagElem = document.getElementById('detail-team-tag');

  tagElem.textContent = team.tag;

  tagElem.className =
    `team-tag banner-tag ${team.tagClass}`;


  const mainImg =
    document.getElementById('detail-team-img');

  mainImg.src = team.image;


  document.getElementById('detail-team-name').textContent =
    team.name;

  document.getElementById('detail-team-city').textContent =
    team.city;

  document.getElementById('detail-team-stadium').textContent =
    team.stadium;

  document.getElementById('detail-team-capacity').textContent =
    team.capacity;

  document.getElementById('detail-team-titles').textContent =
    team.titles;

  document.getElementById('detail-team-founded').textContent =
    team.founded;

  document.getElementById('detail-team-nickname').textContent =
    team.nickname;

  document.getElementById('detail-team-manager').textContent =
    team.manager;

  document.getElementById('detail-team-desc').textContent =
    team.desc;


  // ==========================================================
  // GALERÍA
  // ==========================================================

  const galleryContainer =
    document.getElementById('detail-stadium-gallery');

  galleryContainer.innerHTML = '';


  team.gallery.forEach((imgUrl, idx) => {

    const wrapper =
      document.createElement('div');

    wrapper.className =
      'gallery-thumb-wrapper';

    if (idx === 0) {
      wrapper.classList.add('selected');
    }


    const imgElem =
      document.createElement('img');

    imgElem.src = imgUrl;
    imgElem.className = 'gallery-thumb';


    wrapper.onclick = () => {

      mainImg.src = imgUrl;

      document
        .querySelectorAll('.gallery-thumb-wrapper')
        .forEach(t => t.classList.remove('selected'));

      wrapper.classList.add('selected');
    };


    wrapper.appendChild(imgElem);

    galleryContainer.appendChild(wrapper);

  });


  // ==========================================================
  // JUGADORES
  // ==========================================================

  const rosterContainer =
    document.getElementById('detail-team-roster');

  rosterContainer.innerHTML = '';


  team.roster.forEach(player => {

    const card =
      document.createElement('div');

    card.className =
      'roster-card';


    card.innerHTML = `
      <img
        class="roster-player-img"
        src="${player.img}"
        alt="${player.name}"
      >

      <div class="roster-info">
        <strong>${player.name}</strong>
        <small>${player.role}</small>
      </div>
    `;


    rosterContainer.appendChild(card);

  });


  document
    .querySelectorAll('.tab-screen')
    .forEach(s => s.classList.remove('active'));

  document
    .querySelectorAll('.tab-btn')
    .forEach(b => b.classList.remove('active'));


  document
    .getElementById('team-detail-screen')
    .classList.add('active');


  document
    .getElementById('team-detail-screen')
    .scrollTop = 0;
}


function backToHome() {

  switchTab(
    'home-screen',
    document.querySelector('.tab-btn')
  );

}


function openVRFromDetail() {

  openVRDirectly(currentSelectedTeamKey);

}


function goToTriviaFromDetail() {

  switchTab(
    'trivia-screen',
    document.querySelectorAll('.tab-btn')[3]
  );

}


// ============================================================
// REALIDAD AUMENTADA / CÁMARA / THREE.JS
// ============================================================

let scene = null;
let camera = null;
let renderer = null;
let baseballModel = null;

let isSpinning = false;


// ============================================================
// MODELOS 3D POR EQUIPO
// ============================================================

const MODEL_3D_PATHS = {

  // Modelo 3D de Acereros
  ace: 'modelos/acereroslogomodelo.glb'

};


// ============================================================
// ABRIR REALIDAD AUMENTADA DESDE EL EQUIPO
// ============================================================

async function openVRDirectly(teamKey) {
  currentSelectedTeamKey = teamKey || 'alg';
  const team = teamsData[currentSelectedTeamKey];
  if (!team) return;

  document.getElementById('ar-team-title').textContent = team.name;
  document.getElementById('ar-team-summary').textContent = `${team.city} · ${team.stadium}`;

  // Mostramos el modal de AR directamente (MindAR se encarga de encender la cámara automáticamente)
  const modal = document.getElementById('ar-experience-modal');
  modal.classList.remove('hidden');
}


// ============================================================
// ABRIR ESCÁNER
// ============================================================

// ============================================================
// ABRIR ESCÁNER (Versión corregida para MindAR)
// ============================================================
async function openScannerView() {
  
  // Ocultamos la vista previa inicial si existe
  const scannerOverlay = document.getElementById('ar-scanner-overlay');
  if(scannerOverlay) {
      scannerOverlay.classList.add('hidden');
  }

  // Aseguramos que la interfaz de botones esté visible
  document.getElementById('ar-detected-content').classList.remove('hidden');

  // Mostramos el contenedor general de Realidad Aumentada
  const modal = document.getElementById('ar-experience-modal');
  modal.classList.remove('hidden');

  // MindAR inicializará la cámara automáticamente al estar visible la etiqueta <a-scene>
  console.log("Iniciando escáner AR...");
}


// ============================================================
// TOMAR FOTO
// ============================================================

function takePhoto() {

  // Se mantiene igual.
  // Actualmente el botón no modifica el flujo.

}


// ============================================================
// CERRAR AR
// ============================================================

function closeARView() {

  if (currentStream) {

    currentStream
      .getTracks()
      .forEach(t => t.stop());

    currentStream = null;

  }


  document
    .getElementById('ar-experience-modal')
    .classList.add('hidden');


  isSpinning = false;

}


// ============================================================
// VER INFORMACIÓN COMPLETA DESDE AR
// ============================================================

function openFullInfoFromAR() {

  closeARView();

  openTeamDetail(
    currentSelectedTeamKey
  );

}


// ============================================================
// INICIALIZAR THREE.JS
// ============================================================

function init3DBaseball() {

  const container =
    document.getElementById('ar-3d-container');


  if (!container) {
    console.error(
      'No existe el contenedor ar-3d-container.'
    );
    return;
  }


  // Limpiar contenido anterior
  container.innerHTML = '';


  const width =
    container.clientWidth || 280;

  const height =
    container.clientHeight || 240;


  // ==========================================================
  // ESCENA
  // ==========================================================

  scene =
    new THREE.Scene();


  // ==========================================================
  // CÁMARA
  // ==========================================================

  camera =
    new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );


  camera.position.set(
    0,
    0,
    4
  );


  // ==========================================================
  // RENDERER
  // ==========================================================

  renderer =
    new THREE.WebGLRenderer({

      alpha: true,
      antialias: true

    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );


  renderer.setSize(
    width,
    height
  );


  // Para Three.js r128
  renderer.outputEncoding =
    THREE.sRGBEncoding;


  container.appendChild(
    renderer.domElement
  );


  // ==========================================================
  // ILUMINACIÓN
  // ==========================================================

  const ambientLight =
    new THREE.AmbientLight(
      0xffffff,
      1.05
    );

  scene.add(
    ambientLight
  );


  const dirLight =
    new THREE.DirectionalLight(
      0xffffff,
      1.0
    );


  dirLight.position.set(
    5,
    5,
    5
  );


  scene.add(
    dirLight
  );


  const fillLight =
    new THREE.DirectionalLight(
      0xffffff,
      0.5
    );


  fillLight.position.set(
    -4,
    2,
    2
  );


  scene.add(
    fillLight
  );


  // ==========================================================
  // BUSCAR MODELO DEL EQUIPO
  // ==========================================================

  const modelPath =
    MODEL_3D_PATHS[
      currentSelectedTeamKey
    ];


  // ==========================================================
  // CARGAR MODELO GLB DE ACEREROS
  // ==========================================================

  if (
    modelPath &&
    typeof THREE.GLTFLoader === 'function'
  ) {

    const loader =
      new THREE.GLTFLoader();


    loader.load(

      modelPath,


      // ======================================================
      // MODELO CARGADO CORRECTAMENTE
      // ======================================================

      (gltf) => {

        baseballModel =
          gltf.scene;


        baseballModel.name =
          'Acereros3DModel';


        // ====================================================
        // CALCULAR DIMENSIONES
        // ====================================================

        const box =
          new THREE.Box3()
            .setFromObject(
              baseballModel
            );


        const size =
          box.getSize(
            new THREE.Vector3()
          );


        const center =
          box.getCenter(
            new THREE.Vector3()
          );


        // Obtener la dimensión más grande
        const maxDimension =
          Math.max(
            size.x,
            size.y,
            size.z
          ) || 1;


        // ====================================================
        // ESCALA AUTOMÁTICA
        // ====================================================

        const targetSize =
          2.2;


        const scale =
          targetSize /
          maxDimension;


        baseballModel.scale.setScalar(
          scale
        );


        // ====================================================
        // CENTRAR MODELO
        // ====================================================

        baseballModel.position.set(

          -center.x * scale,

          -center.y * scale,

          -center.z * scale

        );


        // ====================================================
        // CONFIGURACIÓN DE MATERIALES
        // ====================================================

        baseballModel.traverse(
          (child) => {

            if (
              child.isMesh
            ) {

              child.castShadow =
                false;

              child.receiveShadow =
                false;


              if (
                child.material
              ) {

                child.material.needsUpdate =
                  true;

              }

            }

          }
        );


        // ====================================================
        // AGREGAR A LA ESCENA
        // ====================================================

        scene.add(
          baseballModel
        );


        console.log(
          'Modelo 3D de Acereros cargado correctamente.'
        );

      },


      // ======================================================
      // PROGRESO
      // ======================================================

      undefined,


      // ======================================================
      // ERROR
      // ======================================================

      (error) => {

        console.error(
          'No se pudo cargar el modelo 3D de Acereros:',
          error
        );


        createFallbackBaseball();

      }

    );

  }


  // ==========================================================
  // SI NO HAY MODELO, USAR PELOTA 3D ORIGINAL
  // ==========================================================

  else {

    createFallbackBaseball();

  }


  // ==========================================================
  // INICIAR ANIMACIÓN
  // ==========================================================

  animate3D();

}


// ============================================================
// PELOTA 3D ORIGINAL COMO FALLBACK
// ============================================================

function createFallbackBaseball() {

  const geometry =
    new THREE.SphereGeometry(
      1.2,
      32,
      32
    );


  const material =
    new THREE.MeshStandardMaterial({

      color: 0xfafafa,
      roughness: 0.25,
      metalness: 0.1

    });


  baseballModel =
    new THREE.Mesh(
      geometry,
      material
    );


  // ==========================================================
  // COSTURAS
  // ==========================================================

  const seamGeometry =
    new THREE.TorusGeometry(
      1.22,
      0.04,
      16,
      100
    );


  const seamMaterial =
    new THREE.MeshStandardMaterial({

      color: 0xff3b5c,
      roughness: 0.5

    });


  const seam1 =
    new THREE.Mesh(
      seamGeometry,
      seamMaterial
    );


  seam1.rotation.x =
    Math.PI / 2.5;


  baseballModel.add(
    seam1
  );


  const seam2 =
    new THREE.Mesh(
      seamGeometry,
      seamMaterial
    );


  seam2.rotation.y =
    Math.PI / 2.5;


  baseballModel.add(
    seam2
  );


  scene.add(
    baseballModel
  );

}


// ============================================================
// REDIMENSIONAR THREE.JS
// ============================================================

window.addEventListener(
  'resize',
  () => {

    const container =
      document.getElementById(
        'ar-3d-container'
      );


    if (
      !container ||
      !renderer ||
      !camera
    ) {
      return;
    }


    const width =
      container.clientWidth || 280;


    const height =
      container.clientHeight || 240;


    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
      width,
      height
    );

  }
);


// ============================================================
// ANIMACIÓN DEL MODELO
// ============================================================

function animate3D() {

  if (!renderer) {
    return;
  }


  requestAnimationFrame(
    animate3D
  );


  if (baseballModel) {

    const speed =
      isSpinning
        ? 0.03
        : 0.004;


    baseballModel.rotation.x +=
      speed;


    baseballModel.rotation.y +=
      speed * 1.2;

  }


  renderer.render(
    scene,
    camera
  );

}


// ============================================================
// BOTÓN GIRAR
// ============================================================

function toggleModelSpin() {

  isSpinning =
    !isSpinning;

}


// ============================================================
// CONFETI
// ============================================================

function triggerConfetti() {

  if (
    typeof confetti === 'function'
  ) {

    confetti({

      particleCount: 80,
      spread: 70,
      origin: {
        y: 0.6
      }

    });

  }

}


// ============================================================
// TRIVIA - ESTILO KAHOOT
// ============================================================

const kahootColors = [
  'red',
  'blue',
  'yellow',
  'green'
];

const kahootIcons = [
  'fa-caret-up',
  'fa-diamond',
  'fa-circle',
  'fa-square'
];


function startTrivia() {

  currentQuestionIndex = 0;

  triviaScore = 0;

  correctCount = 0;


  document
    .getElementById('trivia-welcome')
    .classList.add('hidden');


  document
    .getElementById('trivia-result')
    .classList.add('hidden');


  document
    .getElementById('trivia-quiz')
    .classList.remove('hidden');


  renderQuestion();

}


// ============================================================
// TEMPORIZADOR
// ============================================================

function startTimer() {

  clearInterval(
    triviaTimer
  );


  timeLeft = 20;


  const timerElem =
    document.getElementById(
      'trivia-timer'
    );


  timerElem.textContent =
    timeLeft;


  triviaTimer =
    setInterval(() => {

      timeLeft--;


      timerElem.textContent =
        timeLeft;


      if (
        timeLeft <= 0
      ) {

        clearInterval(
          triviaTimer
        );


        autoFailQuestion();

      }

    }, 1000);

}


// ============================================================
// FALLAR PREGUNTA AUTOMÁTICAMENTE
// ============================================================

function autoFailQuestion() {

  const qData =
    triviaQuestions[
      currentQuestionIndex
    ];


  const buttons =
    document.querySelectorAll(
      '.kahoot-option-btn'
    );


  buttons.forEach(
    (btn, idx) => {

      btn.disabled =
        true;


      if (
        idx === qData.correct
      ) {

        btn.classList.add(
          'correct'
        );

      } else {

        btn.classList.add(
          'incorrect'
        );

      }

    }
  );


  document
    .getElementById(
      'trivia-next-btn'
    )
    .classList.remove(
      'hidden'
    );

}


// ============================================================
// MOSTRAR PREGUNTA
// ============================================================

function renderQuestion() {

  startTimer();


  const qData =
    triviaQuestions[
      currentQuestionIndex
    ];


  document
    .getElementById(
      'trivia-progress'
    )
    .textContent =
      `PREGUNTA ${currentQuestionIndex + 1} DE ${triviaQuestions.length}`;


  document
    .getElementById(
      'trivia-score'
    )
    .textContent =
      `${triviaScore} PTS`;


  document
    .getElementById(
      'trivia-question'
    )
    .textContent =
      qData.q;


  const optionsContainer =
    document.getElementById(
      'trivia-options'
    );


  optionsContainer.innerHTML =
    '';


  document
    .getElementById(
      'trivia-next-btn'
    )
    .classList.add(
      'hidden'
    );


  qData.options.forEach(
    (optText, index) => {

      const colorClass =
        kahootColors[
          index % 4
        ];


      const iconClass =
        kahootIcons[
          index % 4
        ];


      const btn =
        document.createElement(
          'button'
        );


      btn.className =
        `kahoot-option-btn ${colorClass}`;


      btn.innerHTML = `

        <span class="kahoot-shape-icon">
          <i class="fa-solid ${iconClass}"></i>
        </span>

        <span class="kahoot-option-text">
          ${optText}
        </span>

      `;


      btn.onclick = () =>
        selectOption(
          index,
          qData.correct
        );


      optionsContainer.appendChild(
        btn
      );

    }
  );

}


// ============================================================
// SELECCIONAR RESPUESTA
// ============================================================

function selectOption(
  selectedIndex,
  correctIndex
) {

  clearInterval(
    triviaTimer
  );


  const buttons =
    document.querySelectorAll(
      '.kahoot-option-btn'
    );


  buttons.forEach(
    (btn, idx) => {

      btn.disabled =
        true;


      if (
        idx === correctIndex
      ) {

        btn.classList.add(
          'correct'
        );

      }


      if (
        idx === selectedIndex &&
        selectedIndex !== correctIndex
      ) {

        btn.classList.add(
          'incorrect'
        );

      }

    }
  );


  if (
    selectedIndex === correctIndex
  ) {

    triviaScore += 10;

    userPoints += 10;

    correctCount++;


    updatePointsDisplay();

  }


  document
    .getElementById(
      'trivia-score'
    )
    .textContent =
      `${triviaScore} PTS`;


  document
    .getElementById(
      'trivia-next-btn'
    )
    .classList.remove(
      'hidden'
    );

}


// ============================================================
// SIGUIENTE PREGUNTA
// ============================================================

function nextQuestion() {

  currentQuestionIndex++;


  if (
    currentQuestionIndex <
    triviaQuestions.length
  ) {

    renderQuestion();

  }

  else {

    document
      .getElementById(
        'trivia-quiz'
      )
      .classList.add(
        'hidden'
      );


    document
      .getElementById(
        'trivia-result'
      )
      .classList.remove(
        'hidden'
      );


    document
      .getElementById(
        'trivia-ratio'
      )
      .textContent =
        `${correctCount}/${triviaQuestions.length}`;


    document
      .getElementById(
        'trivia-final-message'
      )
      .textContent =
        `Respondiste correctamente ${correctCount} de ${triviaQuestions.length} preguntas y acumulaste ${triviaScore} puntos.`;

  }

}


// ============================================================
// REINICIAR TRIVIA
// ============================================================

function resetTrivia() {

  document
    .getElementById(
      'trivia-result'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'trivia-welcome'
    )
    .classList.remove(
      'hidden'
    );

}


// ============================================================
// GACHA
// ============================================================

function triggerGacha() {

  if (
    userPoints < 50
  ) {

    document
      .getElementById(
        'no-points-modal'
      )
      .classList.remove(
        'hidden'
      );

    return;

  }


  const ball =
    document.getElementById(
      'baseball-ball'
    );


  const bat =
    document.getElementById(
      'baseball-bat'
    );


  const button =
    document.getElementById(
      'btn-launch'
    );


  button.disabled =
    true;


  userPoints -= 50;


  updatePointsDisplay();


  ball.classList.remove(
    'ball-fly-away'
  );


  bat.classList.remove(
    'bat-swing-hit'
  );


  void ball.offsetWidth;


  bat.classList.add(
    'bat-swing-hit'
  );


  setTimeout(
    () =>
      ball.classList.add(
        'ball-fly-away'
      ),
    300
  );


  setTimeout(
    () => {

      document
        .getElementById(
          'reward-modal'
        )
        .classList.remove(
          'hidden'
        );


      ball.classList.remove(
        'ball-fly-away'
      );


      bat.classList.remove(
        'bat-swing-hit'
      );


      button.disabled =
        false;

    },
    1300
  );

}


// ============================================================
// MODALES
// ============================================================

function closeNoPointsModal() {

  document
    .getElementById(
      'no-points-modal'
    )
    .classList.add(
      'hidden'
    );

}


function closeRewardModal() {

  document
    .getElementById(
      'reward-modal'
    )
    .classList.add(
      'hidden'
    );

}


// ============================================================
// CERRAR SESIÓN
// ============================================================

function logout() {

  document
    .getElementById(
      'app-content'
    )
    .classList.add(
      'hidden'
    );


  switchAuthScreen(
    'login-screen'
  );

}