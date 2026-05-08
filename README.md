# 💸 MisGastosApp

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Una aplicación móvil robusta para la **gestión de finanzas personales**. Diseñada con una arquitectura híbrida utilizando **React Native con Expo**, **TypeScript** para tipado estricto en componentes y **Firebase** como Backend-as-a-Service (BaaS).

---

## 📋 Tabla de Contenidos

- [✨ Características](#-características-principales)
- [🏗️ Arquitectura](#️-arquitectura-y-estructura-del-código)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [🚀 Instalación](#-guía-de-instalación-y-despliegue)


---

## ✨ Características Principales

- 🔐 **Autenticación Bimodal** — Registro/ingreso por correo electrónico y autenticación federada con Google (`@react-native-google-signin/google-signin`).
- ⚡ **Base de Datos Reactiva (Firestore)** — Operaciones CRUD en tiempo real. La interfaz se actualiza instantáneamente mediante suscripciones `onSnapshot` sin necesidad de recargar la vista.
- 🔎 **Filtrado Avanzado en Memoria** — Lógica combinada para filtrar el historial de transacciones por categoría personalizada y selección de mes.
- 📅 **Selector de Fechas Nativo** — Uso de `@react-native-community/datetimepicker` para garantizar una experiencia nativa tanto en iOS como en Android.
- 💰 **Cálculo Dinámico** — Algoritmo de reducción en JavaScript que actualiza el balance total basado en los filtros activos (Categoría + Mes).

---

## 🏗️ Arquitectura y Estructura del Código

El proyecto utiliza una estructura basada en **componentes modulares** y el sistema de enrutamiento basado en archivos de Expo (`app/`).

```
MisGastosApp/
│
├── app/                          # Expo Router: Punto de entrada de la aplicación
├── components/                   # Componentes UI reutilizables tipados con TypeScript (.tsx)
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx           # Componente de texto adaptable al modo oscuro/claro
│   └── ui/                       # Subcomponentes atómicos (IconSymbols, Collapsibles)
│
├── hooks/                        # Custom Hooks de React
│   ├── use-color-scheme.ts       # Detección del esquema de color del sistema (Light/Dark)
│   └── use-theme-color.ts
│
├── constants/                    # Variables de configuración global
│   └── theme.ts                  # Paletas de color centralizadas
│
├── ExpensesScreen.js             # Vista principal: CRUD, filtros y renderizado del historial
├── LoginScreen.js                # Vista de acceso: Formularios y lógica de Firebase Auth
├── firebaseConfig.js             # Inicialización del SDK de Firebase
│
├── google-services.json          # Credenciales de Google Cloud para Android
├── tsconfig.json                 # Configuración estricta de TypeScript
├── eslint.config.js              # Reglas de linting
└── package.json                  # Dependencias y scripts de Expo
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| **Core** | React Native, Expo SDK |
| **Lenguajes** | JavaScript (ES6+), TypeScript |
| **Autenticación** | Firebase Authentication, Google Sign-In |
| **Base de Datos** | Firebase Cloud Firestore |
| **Herramientas** | ESLint, Metro Bundler |

---

## 🚀 Guía de Instalación y Despliegue

### Requisitos Previos

- [Node.js](https://nodejs.org/) instalado
- Cuenta configurada en [Firebase Console](https://console.firebase.google.com/)
- Dispositivo físico con la app **Expo Go** o un emulador (Android Studio / Xcode)

### Pasos para Ejecución Local

**1. Clonar el repositorio**
```bash
git clone https://github.com/Jonixmax/MisGastosApp.git
cd MisGastosApp
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar el entorno (Firebase)**

> ⚠️ Sustituye el contenido de `firebaseConfig.js` con las variables de entorno de tu propio proyecto web de Firebase.
> Si vas a compilar el APK/AAB para Android, coloca tu propio archivo `google-services.json` en la raíz del proyecto.

**4. Levantar el entorno de desarrollo**
```bash
npx expo start --clear
```
> 💡 Usa la bandera `--clear` en la primera ejecución para limpiar la caché de Metro Bundler.

---


