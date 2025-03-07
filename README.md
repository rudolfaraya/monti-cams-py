# Monti-Cams-Py: Sistema de Monitoreo de Tráfico

Este proyecto es un sistema de monitoreo de tráfico que integra un backend en Flask (`servidorHttp.py`), una interfaz gráfica en PyQt5 (`main.py`), y un frontend web (`index.html`). Permite detectar patentes de vehículos desde cámaras, gestionar alertas, mostrar estadísticas, y enviar notificaciones a Telegram.

## Requisitos Previos

- **Sistema Operativo**: Windows (probado en PowerShell).
- **Python**: Versión 3.12.7 o superior.
- **Dependencias**:
  ```powershell
  pip install flask flask-socketio flask-session pyqt5 requests playsound==1.2.2

## Estructura de Carpetas
```
monti-cams-py/
├── servidorHttp.py         # Backend Flask
├── main.py                 # Frontend PyQt5
├── static/
│   ├── camara1.cam         # Configuración de la cámara (ejemplo: "192.168.1.100,80,admin,admin,Camara1")
│   ├── data.json           # Generado automáticamente para alertas
│   ├── alarma.mp3          # Sonido de alarma para el frontend web
│   ├── Global/             # Carpeta para imágenes panorámicas (crear vacía)
│   ├── Small/              # Carpeta para imágenes de placas (crear vacía)
│   └── assets/             # Recursos CSS/JS de Material Dashboard
├── templates/
│   └── index.html          # Frontend web
├── sonidos/
│   └── alarma.mp3          # Sonido de alarma para PyQt5 (puede ser el mismo que en static/)
└── base_datos.db           # Base de datos SQLite (se genera automáticamente)
```
- Crear cámara1.cam
Crea el archivo static/camara1.cam con los datos de tu cámara:
```
192.168.1.100,80,admin,admin,Camara1
```
Ajusta la IP, puerto, usuario, contraseña y nombre según tu cámara.
- Sonido de Alarma
Copia un archivo MP3 llamado alarma.mp3 en static/ y sonidos/. Puedes usar cualquier archivo MP3 corto.

### Instalación
1. Instalación de dependencias
```bash
pip install flask flask-socketio flask-session pyqt5 requests playsound==1.2.2
```
2. Verificar instalación:
```bash
pip list
```

### Ejecución local
El backend Flask proporciona el dashboard web y gestiona la base de datos.
1. Abre una terminal en monti-cams-py/:
```bash
python .\servidorHttp.py
```
2. Verifica que el servidor esté corriendo:
- Abre un navegador en http://localhost:8000.
- Inicia sesión con usuario `admin` y contraseña `admin` (se crea automáticamente la primera vez).

3. Ejecutar el Frontend PyQt5 (main.py) con Cámara Real
La interfaz PyQt5 conecta a una cámara y detecta eventos de tráfico.
- Asegúrate de tener el SDK NetSDK en el directorio NetSDK/ (no incluido en este repo).
- Abre otra terminal en monti-cams-py/:
```bash
python .\main.py
```
En la interfaz:
- Ingresa los datos de camara1.cam (IP, puerto, usuario, contraseña).
- Haz clic en "Login" y luego en "Recibir alertas".
- Si la cámara está configurada correctamente, verás eventos en la tabla y alertas en Telegram.









