# FactorFIT Backend, Frontend & Database <em style="font-size: 20px;">by Silvestre Jesús Guadalupe Gutiérrez</em>

## Descripción del proyecto

FactorFIT es una aplicación de gestión de **gimnasios** que incluye un **backend** basado en **PHP (Laravel)** para la lógica de negocio y la API, y un **frontend** desarrollado con **Angular** para la interfaz de usuario. Este repositorio contiene el código fuente completo y la configuración para ambos.

---

## Instrucciones de instalación

### Requisitos previos

Asegúrate de tener instalados los siguientes requisitos en tu sistema para poder ejecutar el proyecto:

* **Docker** y **Docker Compose** (para la base de datos PostgreSQL).
* **PHP** (versión compatible con el backend, asumido Laravel).
* **Composer** (gestor de dependencias de PHP).
* **Node.js** y **npm** (para el frontend).

### Pasos de instalación

Sigue estos pasos en orden para configurar y levantar la aplicación.

1.  **Backend y base de datos (PostgreSQL):**

    Primero, inicia el contenedor de la base de datos y luego instala las dependencias del backend.

    ```bash
    # Iniciar la base de datos en Docker
    cd postgres
    docker compose up -d
    
    # Moverse al directorio del backend
    cd ../backend
    
    # Instalar las dependencias de PHP
    composer install
    ```

2.  **Configuración de entorno:**

    * **Renombra** el archivo de configuración de ejemplo.
    * **Configura** las variables de entorno, asegurando que la conexión a la base de datos coincida con la configuración de Docker (usuario: `admin`, base de datos: `FactorFIT`, etc.).

    ```bash
    # Ejecutar en el directorio del backend
    cp .env.example .env
    # Luego, editar el archivo .env
    ```

3.  **Migraciones, seeders y servidor de backend:**

    Ejecuta las migraciones para crear las tablas de la base de datos y los *seeders* para llenarlas con datos iniciales de prueba. Luego, levanta el servidor de desarrollo del backend.

    ```bash
    # Ejecutar en el directorio del backend
    php artisan migrate:fresh          # Ejecuta migraciones
    php artisan migrate:fresh --seed   # Ejecuta migraciones y seeders
    php artisan serve                  # Inicia el servidor de desarrollo
    ```

4.  **Frontend:**

    Navega al directorio del frontend, instala las dependencias de Node.js e inicia el servidor de desarrollo del frontend.

    ```bash
    # Ejecutar en el directorio del frontend
    npm install
    npm start
    ```

---

## Uso

Una vez que el backend y el frontend estén corriendo, la aplicación debería ser accesible en la dirección y puerto especificados por el comando `npm start` (usualmente `http://localhost:4200` o similar, si se utiliza Angular).

* **Accede a la URL** provista por el frontend.
* La aplicación está lista para ser probada con los datos iniciales cargados por los *seeders*.

---

## Acceso a la base de datos

Si necesitas acceder a la consola interactiva de **PostgreSQL** dentro del contenedor de Docker para revisar datos o realizar diagnósticos, usa el siguiente comando:

```bash
docker exec -it postgres_gym psql -U admin -d FactorFIT
```