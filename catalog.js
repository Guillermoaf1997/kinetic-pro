// catalog.js - Catálogo Maestro de 500 Ejercicios (6 Grupos · 3 Niveles)
// Los datos en bruto (RAW_EXERCISE_DB) no cambian respecto a la versión original.
// Lo que sí cambia es cómo se infiere el equipamiento y cómo se valida el
// resultado al final, para detectar fallos de clasificación en desarrollo
// en vez de descubrirlos en producción cuando una rutina pide material
// que el usuario no tiene.

const RAW_EXERCISE_DB = {
  "Pectoral": {
    1: [
      "Flexiones contra pared", "Flexiones inclinadas altas (manos a altura de cadera)",
      "Flexiones inclinadas medias (manos a altura de rodilla)", "Flexiones inclinadas bajas (manos a altura de tobillo)",
      "Flexiones sobre rodillas estrictas", "Flexiones sobre rodillas agarre ancho",
      "Flexiones sobre rodillas agarre cerrado", "Flexiones excéntricas en suelo (bajada de 4 segundos)",
      "Flexiones escapulares en suelo (retracción y protracción dinámica)", "Flexiones escapulares inclinadas",
      "Flexiones clásicas en suelo (ROM completo)", "Flexiones clásicas con pausa de 1 segundo abajo",
      "Flexiones agarre ancho en suelo", "Flexiones sobre nudillos en suelo",
      "Flexiones sobre paralelas bajas (agarre neutro)", "Flexiones con liberación de manos (hand-release push-ups)",
      "Flexiones escalonadas (una mano adelantada)", "Flexiones con toque alterno de hombro dinámico",
      "Flexiones inclinadas en anillas (ángulo de 60°)", "Flexiones inclinadas en anillas (ángulo de 45°)",
      "Fondos en banco con rodillas flexionadas", "Fondos en banco con piernas extendidas",
      "Fondos negativos en paralelas (bajada controlada de 4 segundos)", "Fondos asistidos con banda elástica en paralelas",
      "Fondos parciales superiores en paralelas", "Flexiones con deslizamiento lateral unilateral (sobre rodillas)",
      "Flexiones tempo 3-1-1 en suelo", "Flexiones con rotación torácica dinámica (T-push-ups)",
      "Flexiones en barra baja (altura de cintura)", "Flexiones en barra baja (altura de espinilla)"
    ],
    2: [
      "Fondos en paralelas estrictos (torso inclinado para énfasis pectoral)", "Fondos en paralelas con pausa de 1 segundo abajo",
      "Fondos en paralelas tempo 3-0-1", "Fondos en barra recta (straight bar dips)",
      "Fondos en barra recta con pausa abajo", "Flexiones declinadas (pies elevados a 30 cm)",
      "Flexiones declinadas (pies elevados a 60 cm)", "Flexiones declinadas agarre ancho",
      "Flexiones en déficit (manos sobre paralelas o bloques)", "Flexiones en déficit declinadas",
      "Flexiones arqueras (archer push-ups)", "Flexiones arqueras declinadas",
      "Flexiones máquina de escribir (typewriter push-ups)", "Flexiones en anillas al ras del suelo",
      "Flexiones en anillas con rotación externa (RTO) arriba", "Flexiones declinadas en anillas",
      "Aperturas deslizantes en suelo (sliding chest flyes)", "Aperturas en anillas (ring flyes) ángulo medio",
      "Aperturas en anillas ángulo bajo", "Fondos en anillas estrictos",
      "Fondos en anillas con pausa abajo", "Flexiones pliométricas (despegue de manos en suelo)",
      "Flexiones con palmada frontal", "Flexiones hindúes (Hindu push-ups)",
      "Flexiones dive bomber", "Flexiones spiderman",
      "Flexiones pseudo-planche (inclinación anterior leve)", "Flexiones pseudo-planche (inclinación anterior media)",
      "Flexiones de 1.5 repeticiones", "Flexiones pliométricas alternando ancho de manos",
      "Flexiones profundas en barra recta", "Fondos en paralelas con elevación dinámica de rodillas",
      "Flexiones sobre superficie inestable", "Flexiones arqueras sobre paralelas bajas",
      "Flexiones crocodile (desplazamiento frontal dinámico)", "Flexiones pliométricas con toque rápido de pecho",
      "Fondos en paralelas abiertas (en V)", "Flexiones excéntricas a una mano (bajada controlada)",
      "Flexiones a una mano inclinadas (altura de cadera)", "Flexiones a una mano inclinadas (altura de rodilla)"
    ],
    3: [
      "Fondos búlgaros en anillas (Ring Bulgarian dips)", "Fondos en anillas con rotación externa completa (RTO dips)",
      "Fondos en anillas declinados (pies elevados en soporte)", "Fondos coreanos (Korean dips) en barra recta",
      "Fondos coreanos en paralelas", "Fondos profundos en déficit máximo sobre paralelas altas",
      "Flexiones a una mano estrictas (One-arm push-ups)", "Flexiones a una mano con piernas juntas",
      "Flexiones a una mano declinadas", "Flexiones arqueras a una mano",
      "Flexiones pseudo-planche con inclinación máxima", "Flexiones Maltese asistidas en anillas",
      "Flexiones pelican en anillas (rango medio)", "Flexiones pelican completas en anillas",
      "Flexiones pliométricas con palmada detrás de la espalda", "Flexiones Superman (despegue total de manos y pies)",
      "Flexiones Aztec (toque de punteras en el aire)", "Flexiones pliométricas con giro de 360° en el aire",
      "Flexiones pliométricas desde suelo a cajón alto", "Fondos pliométricos en paralelas (despegue de manos)",
      "Fondos explosivos en barra recta con toque de pecho", "Aperturas arqueras unilaterales en anillas",
      "Fondos en anillas con RTO profundo abajo y arriba", "Flexiones grasshopper dinámicas",
      "Flexiones pseudo-planche en anillas", "Flexiones typewriter en déficit profundo",
      "Flexiones a una mano sobre paralela baja", "Fondos coreanos inversos (reverse Korean dips)",
      "Flexiones planche lean declinadas contra pared", "Fondos en anillas con excéntrica de 5 segundos y subida explosiva"
    ]
  },
  "Espalda": {
    1: [
      "Retracciones escapulares dinámicas colgado en barra", "Retracciones escapulares dinámicas en remo invertido",
      "Remo invertido (Australian pull-ups) en barra alta (60°)", "Remo invertido en barra media (torso a 45°)",
      "Remo invertido en barra baja (torso horizontal)", "Remo invertido agarre supino",
      "Remo invertido agarre ancho", "Remo invertido agarre neutro (en paralelas bajas)",
      "Remo en anillas con torso a 60°", "Remo en anillas con torso a 45°",
      "Remo en anillas con torso horizontal", "Remo en anillas con rotación de muñeca (prono a supino)",
      "Dominadas australianas con pausa de 1 segundo arriba", "Dominadas australianas excéntricas (bajada de 4 segundos)",
      "Dominadas australianas a un brazo (torso alto)", "Dominadas australianas con pies elevados (cajón bajo)",
      "Dominadas negativas en barra (salto y bajada de 4 segundos)", "Dominadas negativas agarre supino",
      "Dominadas negativas agarre neutro", "Dominadas asistidas con banda elástica (agarre prono)",
      "Dominadas asistidas con banda elástica (agarre supino)", "Dominadas con apoyo leve de punteras en cajón",
      "Pull-overs asistidos en barra baja", "Deslizamientos escapulares en pared (wall slides dinámicos)",
      "Tracción horizontal en barra baja con rodillas flexionadas", "Dominadas australianas con agarre falso (false grip)",
      "Aperturas posteriores en anillas (reverse fly ángulo alto)", "Dominadas pronas estrictas (rango base hasta barbilla)",
      "Dominadas neutras estrictas", "Tracciones escapulares con elevación leve de esternón"
    ],
    2: [
      "Dominadas pronas estrictas (ROM completo)", "Dominadas pronas agarre ancho",
      "Dominadas pronas agarre cerrado", "Dominadas neutras en paralelas o barra multiagarre",
      "Dominadas comando (agarre alterno lateral en barra)", "Dominadas en L-sit (piernas elevadas a 90°)",
      "Dominadas arqueras (archer pull-ups)", "Dominadas máquina de escribir (typewriter pull-ups)",
      "Dominadas al pecho (chest-to-bar)", "Dominadas explosivas al esternón",
      "Dominadas en anillas con rotación libre", "Dominadas en anillas con agarre falso",
      "Dominadas trasnuca (movilidad escapular completa)", "Dominadas con pausa arriba y a mitad de recorrido",
      "Dominadas de 1.5 repeticiones", "Dominadas con agarre mixto",
      "Desplazamientos laterales colgando en barra", "Remo invertido con pies elevados en cajón alto",
      "Remo invertido en anillas con pies elevados", "Remo arquero en anillas",
      "Remo máquina de escribir en anillas", "Remos en tuck front lever en barra",
      "Remos en tuck front lever en anillas", "Ice cream makers en tuck",
      "Elevaciones dinámicas desde cuelgue a tuck front lever", "Dominadas escapulares explosivas",
      "Dominadas pliométricas con cambio de agarre", "Dominadas en toalla (agarre doble)",
      "Trepa de cuerda vertical asistida con piernas", "Pull-overs estrictos en barra alta",
      "Remo unilateral en anillas (cuerpo horizontal)", "Remo en anillas agarre ancho (codos abiertos)",
      "Dominadas con elevación alterna de rodillas", "Dominadas tempo 3-1-1",
      "Retracciones escapulares dinámicas en tuck front lever", "Dominadas con toque alterno de hombro arriba",
      "Dominadas en barra gruesa (fat bar)", "Remos invertidos pliométricos (despegue de manos)",
      "Dominadas con pausa muerta de 2 segundos abajo", "Tracciones invertidas en anillas (inverted pull-ups)"
    ],
    3: [
      "Muscle-ups explosivos en barra", "Muscle-ups estrictos en barra (sin kipping)",
      "Muscle-ups agarre ancho en barra", "Muscle-ups agarre cerrado en barra",
      "Muscle-ups en anillas estrictos", "Muscle-ups en anillas con agarre falso profundo",
      "Dominadas explosivas al abdomen (waist-to-bar)", "Dominadas pliométricas con palmada en barra",
      "Dominadas pliométricas con giro de 180° en el aire", "Dominadas a un brazo estrictas (OAP)",
      "Dominadas a un brazo agarre neutro", "Dominadas a un brazo asistidas con un dedo",
      "Dominadas a un brazo asistidas con toalla baja", "Remos en advanced tuck front lever",
      "Remos en straddle front lever", "Remos en full front lever",
      "Elevaciones completas desde cuelgue a front lever", "Elevaciones completas desde cuelgue a invertido (180°)",
      "Ice cream makers en straddle", "Ice cream makers en full front lever",
      "Remos Victorian asistidos en anillas", "Remos Victorian en paralelas",
      "Dominadas estilo butterfly estrictas", "Dominadas arqueras en anillas (extensión completa)",
      "Trepa de cuerda vertical sin piernas (legless)", "Dominadas explosivas en barra alta con toque de cadera",
      "Dominadas con excéntrica a un brazo (5 segundos)", "Muscle-ups en L-sit estricto durante la transición",
      "Muscle-ups desde L-sit en barra baja", "Transferencias aéreas explosivas de barra a barra"
    ]
  },
  "Hombros": {
    1: [
      "Flexiones en pica (pike push-ups) con rodillas semiflexionadas", "Flexiones en pica en suelo con piernas extendidas",
      "Elevaciones escapulares dinámicas en posición de pica", "Flexiones en pica inclinadas (manos en cajón)",
      "Caminatas por pared (wall walks) parciales (45°)", "Caminatas por pared completas (pecho a pared)",
      "Face pulls en anillas ángulo alto (60°)", "Face pulls en anillas ángulo medio (45°)",
      "Aperturas posteriores en T en anillas ángulo alto", "Aperturas posteriores en Y en anillas ángulo alto",
      "Elevaciones laterales inclinadas con peso corporal", "Elevaciones frontales inclinadas en anillas",
      "Press de hombro en posición de oso (bear crawl press)", "Rotaciones externas de hombro en anillas ángulo alto",
      "Retracciones escapulares en posición de oso", "Flexiones en pica excéntricas (bajada de 4 segundos)",
      "Flexiones en pica con pausa de 1 segundo abajo", "Deslizamientos escapulares en pica sobre toalla",
      "Face pulls en barra baja (agarre ancho al cuello)", "Transiciones dinámicas de plancha alta a perro boca abajo"
    ],
    2: [
      "Flexiones en pica con pies elevados (cajón 40 cm)", "Flexiones en pica con pies elevados (altura cadera)",
      "Flexiones en pica en déficit (manos en paralelas)", "Flexiones en pica en déficit con pies elevados",
      "Flexiones en pino contra pared (espalda a pared)", "Flexiones en pino contra pared (chest-to-wall HSPU)",
      "Flexiones en pino contra pared excéntricas (5 segundos)", "Flexiones en pino contra pared con pausa abajo",
      "Flexiones en pino contra pared en déficit leve", "Face pulls en anillas con cuerpo horizontal",
      "Aperturas posteriores en T en anillas horizontal", "Aperturas posteriores en Y en anillas horizontal",
      "Elevaciones laterales en anillas con inclinación media", "Flexiones dive bomber con retorno vertical estricto",
      "Flexiones pseudo-planche con protracción escapular", "Flexiones en tuck planche asistidas con banda",
      "Subidas dinámicas a pino desde cuervo (crow press)", "Flexiones en pica arqueras (archer pike push-ups)",
      "Flexiones en pica máquina de escribir", "Flexiones en pino contra pared agarre ancho",
      "Flexiones en pino contra pared agarre cerrado", "Transiciones dinámicas de L-sit a tuck planche",
      "Descensos controlados de pino a pica (wall press negatives)", "Caminatas laterales en pino contra pared",
      "Flexiones en pica pliométricas (despegue de manos)", "Extensiones en anillas con elevación en Y",
      "Press cubano con peso corporal en anillas", "Flexiones en pica sobre paralelas con inclinación",
      "Wall HSPU con toque alterno de hombro", "Aperturas posteriores en L en anillas"
    ],
    3: [
      "Flexiones en pino libres (freestanding HSPU)", "Flexiones en pino contra pared en déficit profundo",
      "Flexiones en pino libres en déficit", "Flexiones en pino en anillas (pies en correas)",
      "Flexiones en pino en anillas libres", "Flexiones a 90 grados (90-degree push-ups)",
      "Press a pino con brazos flexionados", "Press a pino en straddle con brazos rectos",
      "Press a pino en pica con brazos rectos", "Press a pino desde L-sit en paralelas",
      "Flexiones en tuck planche estrictas", "Flexiones en advanced tuck planche",
      "Flexiones en straddle planche", "Flexiones en full planche",
      "Press dinámico de straddle planche a pino", "Press dinámico de full planche a pino",
      "Flexiones Maltese en paralelas o suelo", "Press de Maltese a pino en anillas",
      "Flexiones en pino arqueras contra pared", "Flexiones en pino pliométricas contra pared",
      "Flexiones en pino en anillas con apertura lateral", "Hefesto dinámico en barra",
      "Hefesto dinámico en anillas", "Transiciones de planche a front lever por pino en anillas",
      "Flexiones en pino a una mano asistidas contra pared"
    ]
  },
  "Brazos": {
    1: [
      "Extensiones de tríceps contra pared (manos juntas)", "Extensiones de tríceps en barra alta (pecho)",
      "Extensiones de tríceps en barra media (cadera)", "Flexiones diamante sobre rodillas",
      "Flexiones cerradas en suelo (codos pegados)", "Fondos en banco con codos cerrados",
      "Curl de bíceps en barra alta (remo supino inclinado)", "Curl de bíceps en anillas (ángulo alto a 60°)",
      "Curl de bíceps en anillas (ángulo medio a 45°)", "Dominadas australianas supinas agarre cerrado",
      "Headbangers asistidos en remo supino inclinado", "Flexiones sobre punta de dedos (rodillas)",
      "Flexiones de muñeca dorsal (rodillas)", "Flexiones de muñeca palmar (rodillas)",
      "Aperturas y cierres explosivos de mano colgado", "Supinación y pronación dinámica en anillas",
      "Extensión de tríceps unilateral contra pared", "Curl de bíceps unilateral en anillas (60°)",
      "Fondos en paralelas asistidos torso vertical", "Extensiones de tríceps en anillas (60°)",
      "Flexiones cobra (extensión pura de codo)", "Dominadas supinas negativas (4 segundos)",
      "Flexiones sobre nudillos en inclinación", "Flexiones de muñeca en barra baja (wrist curls)",
      "Flexiones diamante inclinadas (manos en cajón)"
    ],
    2: [
      "Extensiones de tríceps en barra baja (skullcrushers)", "Extensiones de tríceps en suelo (floor skullcrushers)",
      "Extensiones de tríceps en anillas (ángulo bajo)", "Extensiones de tríceps sobre cabeza en anillas",
      "Flexiones diamante estrictas en suelo", "Flexiones diamante declinadas",
      "Flexiones tiger bend en suelo", "Flexiones tiger bend en pared o cajón",
      "Fondos en paralelas verticales estrictos", "Fondos en paralelas en L (énfasis tríceps)",
      "Curl de bíceps en anillas (cuerpo horizontal)", "Curl pelican en anillas (ángulo medio)",
      "Curl bayesiano con peso corporal en anillas", "Dominadas supinas (chin-ups) estrictas",
      "Dominadas supinas agarre cerrado (manos juntas)", "Headbangers en barra (agarre supino)",
      "Headbangers en barra (agarre prono)", "Mantle chin-ups en anillas",
      "Curl de bíceps en barra baja (tirón a frente)", "Flexiones sobre punta de dedos completas",
      "Flexiones de muñeca dorsal completas en suelo", "Flexiones de muñeca palmar completas en suelo",
      "Dominadas en toalla (agarre neutro antebrazo)", "Dominadas pliométricas con cambio de agarre",
      "Trepa de cuerda con piernas (agarre y bíceps)", "Extensiones de tríceps unilaterales en barra media",
      "Curl de bíceps unilateral en anillas (45°)", "Flexiones sphinx (extensión simultánea)",
      "Fondos en barra recta verticales", "Curl martillo en anillas (agarre neutro)"
    ],
    3: [
      "Fondos imposibles (Impossible dips) en paralelas", "Fondos imposibles en barra recta",
      "Flexiones tiger bend en pino contra pared", "Flexiones tiger bend libres",
      "Extensiones de tríceps a una mano en barra baja", "Extensiones de tríceps en anillas pies elevados",
      "Flexiones diamante pliométricas", "Curl pelican completo en anillas (horizontal)",
      "Curl pelican con pies elevados", "Hefesto negativo en barra (supinación)",
      "Hefesto negativo en anillas", "Dominadas supinas a un brazo (OAC)",
      "Dominadas supinas a un brazo con pausa a 90°", "Curl de bíceps a una mano en anillas",
      "Headbangers explosivos al pecho en supinación", "Trepa de cuerda sin piernas a brazo alterno",
      "Trepa de cuerda sin piernas a dos manos (dynos)", "Flexiones a una mano sobre punta de dedos",
      "Saltos de agarre en barra gruesa", "Dominadas en pinza (pinch-grip pull-ups)"
    ]
  },
  "Tren Inferior": {
    1: [
      "Sentadilla aérea profunda (Air Squat)", "Sentadilla aérea al cajón (Box Squat)",
      "Sentadilla sumo (piernas anchas)", "Sentadilla cerrada (narrow stance squat)",
      "Sentadilla con pausa de 2 segundos abajo", "Sentadilla tempo 3-1-1",
      "Sentadilla de 1.5 repeticiones", "Zancadas estáticas (split squats)",
      "Zancadas hacia atrás (reverse lunges)", "Zancadas hacia adelante (forward lunges)",
      "Zancadas caminando (walking lunges)", "Zancadas cruzadas (curtsy lunges)",
      "Zancadas laterales (side lunges)", "Subidas al cajón (step-ups 30 cm)",
      "Subidas al cajón (45 cm)", "Subidas laterales al cajón (lateral step-ups)",
      "Extensión de cadera bilateral en banco (glute bridge)", "Extensión de cadera unilateral en banco",
      "Hip thrust unilateral apoyado en banco", "Buenos días con peso corporal (good mornings)",
      "Buenos días a una pierna apoyada (kickstand)", "Elevación de talones bilateral en suelo (gemelos)",
      "Elevación de talones bilateral en escalón", "Elevación de talones con rodillas flexionadas (sóleo)",
      "Elevación de talones unilateral en suelo", "Elevación de talones unilateral en escalón",
      "Sentadilla deslizante contra pared", "Extensión de cadera de pie (patada posterior)",
      "Abducción de cadera de pie", "Caminata del pato parcial (partial duck walk)"
    ],
    2: [
      "Sentadilla búlgara (pie trasero elevado)", "Sentadilla búlgara con pausa de 2 segundos abajo",
      "Sentadilla búlgara en déficit (pie delantero elevado)", "Sentadilla sissy asistida (poste o anillas)",
      "Sentadilla sissy libre", "Sentadilla cosaca (cossack squat) alterna",
      "Sentadilla cosaca con pausa profunda", "Sentadilla skater (rodilla trasera toca suelo)",
      "Sentadilla shrimp asistida (sujetando soporte)", "Sentadilla pistol al cajón a una pierna",
      "Sentadilla pistol excéntrica (bajada 4 segundos)", "Sentadilla con salto (jump squats)",
      "Sentadilla sumo con salto", "Zancadas alternas con salto (jumping lunges)",
      "Saltos al cajón (box jumps 60 cm)", "Saltos al cajón (75 cm)",
      "Saltos horizontales (broad jumps)", "Saltos laterales pliométricos (skater bounds)",
      "Curl femoral deslizante bilateral (anillas/toallas)", "Curl femoral deslizante unilateral",
      "Curl femoral nórdico excéntrico (Nordic curl)", "Curl femoral nórdico asistido con banda",
      "Peso muerto rumano a una pierna (single-leg RDL)", "Hip thrust a una pierna con pausa arriba",
      "Subidas explosivas al cajón (plyo step-ups)", "Sentadilla pistol asistida con anillas o poste",
      "Caminata del pato profunda (full duck walk)", "Sentadilla matrix (extensión rodilla inclinada)",
      "Saltos pogo unilaterales", "Saltos pogo bilaterales",
      "Zancadas búlgaras pliométricas (salto unilateral)", "Sentadilla Jefferson con peso corporal",
      "Elevación de tibial anterior contra pared", "Sentadilla hindú (Hindu squats)",
      "Sentadilla aérea rápida de alta frecuencia"
    ],
    3: [
      "Sentadilla pistol estricta completa (Pistol Squat)", "Sentadilla pistol en déficit (cajón o paralela)",
      "Sentadilla pistol con pausa de 2 segundos abajo", "Sentadilla pistol pliométrica con salto unilateral",
      "Sentadilla shrimp estricta (sujetando pie)", "Sentadilla shrimp avanzada (ambas manos)",
      "Sentadilla dragon pistol (pierna cruzada detrás)", "Sentadilla hawaiian (tobillo sobre rodilla)",
      "Curl femoral nórdico completo (concéntrico/excéntrico)", "Curl femoral nórdico con pausa a 45°",
      "Curl femoral nórdico unilateral", "Extensión natural de piernas completa (sin manos)",
      "Sentadilla sissy con inclinación dorsal máxima", "Saltos en profundidad (depth jumps)",
      "Saltos al cajón a una pierna", "Saltos horizontales encadenados a una pierna",
      "Hip thrust pliométrico unilateral", "Sentadilla pistol con rotación torácica",
      "Zancadas búlgaras en déficit con salto", "Curl femoral en anillas a una pierna",
      "Saltos tuck continuos (rodillas al pecho)", "Sentadilla cosaca con transición baja",
      "Subidas al cajón alto (altura de cadera)", "Sentadilla pistol con elevación de talón abajo",
      "Sprints en cuesta / aceleraciones máximas"
    ]
  },
  "Core": {
    1: [
      "Elevaciones de rodillas colgado en barra (hanging knee raises)", "Elevaciones alternas de rodillas colgado",
      "Elevaciones de rodillas oblicuas colgado", "Elevaciones de rodillas en paralelas",
      "Elevaciones alternas de rodillas en paralelas", "Elevaciones de rodillas oblicuas en paralelas",
      "Elevaciones de rodillas colgado en anillas", "Retroversión pélvica dinámica colgado",
      "Patadas de tijera colgado con rodillas flexionadas", "Flexiones laterales de tronco de pie",
      "Rotaciones balísticas de tronco de pie", "Encogimientos cruzados rodilla a codo de pie",
      "Extensiones con rueda abdominal de rodillas (corto)", "Extensiones con rueda abdominal de rodillas (completo)",
      "Fallouts en anillas altas (ángulo de 60°)", "Fallouts en anillas medias (ángulo de 45°)",
      "Encogimientos de rodillas en anillas bajas", "Encogimientos oblicuos en anillas bajas",
      "Elevaciones de piernas en espaldera (hasta 90°)", "Giros de cadera colgado con piernas flexionadas"
    ],
    2: [
      "Elevaciones de piernas rectas colgado a 90°", "Toes-to-bar estrictos (punteras a barra)",
      "Toes-to-bar con pausa de 1 segundo arriba", "Elevaciones de piernas rectas en paralelas",
      "Elevaciones de piernas abiertas (straddle) en paralelas", "Limpiaparabrisas colgado con rodillas flexionadas",
      "Giros completos colgado (around-the-worlds) rodillas flex.", "Skin the cat dinámico en barra alta",
      "Skin the cat dinámico en anillas", "Patadas alternas (flutter kicks) colgado en L",
      "Pedaleo dinámico colgado en posición de L", "Péndulos laterales con piernas rectas en paralelas",
      "Elevaciones dinámicas a L-sit en paralelas", "Extensiones rueda abdominal de rodillas con pausa",
      "Extensiones diagonales con rueda abdominal", "Fallouts en anillas bajas (cuerpo horizontal)",
      "Serrucho dinámico en anillas bajas (ring body saws)", "Picas dinámicas en anillas bajas",
      "Elevaciones dinámicas a bandera humana en tuck", "Limpiaparabrisas en paralelas rodillas flex.",
      "Elevaciones de piernas rectas en espaldera", "Toes-to-bar alternos (un pie cada vez)",
      "Elevaciones de rodillas colgado agarre neutro", "Rotaciones dinámicas de tronco en anillas",
      "Pulsos dinámicos de cadera en L-sit en paralelas"
    ],
    3: [
      "Toes-to-bar estrictos con excéntrica de 3 segundos", "Limpiaparabrisas colgado con piernas rectas",
      "Giros completos colgado con piernas rectas", "Elevaciones en V colgado (tobillos a barra)",
      "Elevaciones en V en paralelas (V-sit raises)", "Extensiones con rueda abdominal de pie",
      "Extensiones rueda abdominal a una mano (rodillas)", "Extensiones rueda abdominal a una mano (de pie)",
      "Fallouts en anillas a un brazo", "Elevaciones dinámicas a bandera humana en straddle",
      "Elevaciones dinámicas a bandera humana completa", "Elevaciones de dragon flag estrictas",
      "Elevaciones de dragon flag a una pierna", "Limpiaparabrisas invertidos en anillas",
      "Transiciones dinámicas de L-sit a V-sit en paralelas"
    ]
  }
};

// -----------------------------------------------------------------------
// Detección automática de equipamiento y biomecánica por nombre.
// MEJORA: el original solo reconocía "anilla", "paralela" y "barra/colgado/
// dominada", así que cosas como "espaldera", "banco" o "cajón" caían por
// defecto en "Suelo" aunque exigen material específico. Se amplía la lista
// de palabras clave y se añade un orden de prioridad explícito (lo más
// específico primero) para reducir falsos negativos.
// -----------------------------------------------------------------------
function inferEquipment(name) {
  const n = name.toLowerCase();
  if (n.includes('anilla')) return 'Anillas';
  if (n.includes('paralela')) return 'Paralelas';
  if (n.includes('rueda')) return 'Rueda Ab';
  if (
    n.includes('barra') || n.includes('colgado') || n.includes('dominada') ||
    n.includes('toes-to-bar') || n.includes('muscle-up') || n.includes('espaldera') ||
    n.includes('trepa de cuerda')
  ) return 'Barra';
  if (n.includes('banco') || n.includes('cajón') || n.includes('cajon')) return 'Banco/Cajón';
  return 'Suelo';
}

function inferLeverageFactor(group, level) {
  const base = { "Pectoral": 0.65, "Espalda": 0.95, "Hombros": 0.75, "Brazos": 0.60, "Tren Inferior": 0.85, "Core": 0.50 }[group] || 0.70;
  return +(base + (level - 1) * 0.12).toFixed(2);
}

// Hidratar los 500 ejercicios en un diccionario y lista plana
const EXERCISE_CATALOG = [];
const EXERCISE_BY_ID = {};

let globalIdCounter = 1;
Object.keys(RAW_EXERCISE_DB).forEach(group => {
  [1, 2, 3].forEach(level => {
    RAW_EXERCISE_DB[group][level].forEach(name => {
      const id = `ex_${globalIdCounter++}`;
      const isHold = name.toLowerCase().includes('aguante') || name.toLowerCase().includes('isométric');
      const item = {
        id,
        num: globalIdCounter - 1,
        name,
        group,
        level,
        levelName: level === 1 ? 'Principiante' : level === 2 ? 'Intermedio' : 'Avanzado / Élite',
        equipment: inferEquipment(name),
        metric: isHold ? 'seconds' : 'reps',
        leverage: inferLeverageFactor(group, level)
      };
      EXERCISE_CATALOG.push(item);
      EXERCISE_BY_ID[id] = item;
    });
  });
});

// Comprobación de integridad en desarrollo: si algo del catálogo queda mal
// formado (sin grupo, nivel fuera de rango...) se avisa alto y claro en
// consola en vez de fallar silenciosamente más tarde al construir una rutina.
(function validateCatalogIntegrity() {
  const VALID_GROUPS = Object.keys(RAW_EXERCISE_DB);
  const problems = EXERCISE_CATALOG.filter(e =>
    !VALID_GROUPS.includes(e.group) || ![1, 2, 3].includes(e.level) || !e.name
  );
  if (problems.length > 0) {
    console.warn(`[KineticPro] ${problems.length} ejercicios del catálogo tienen datos inválidos.`, problems);
  }
})();
