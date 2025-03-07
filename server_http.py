# PROGRAMA
from asyncio import threads
from flask_socketio import SocketIO, emit
from flask import Flask, jsonify, render_template, url_for, copy_current_request_context, request, Response, \
    send_from_directory, redirect, session
from time import sleep
from threading import Thread, Event
import sqlite3
import os
import os.path
import datetime
import time
from flask_session import Session

filePath = __file__
absFilePath = os.path.abspath(__file__)
absFilePath = os.path.abspath(__file__)
path, filename = os.path.split(absFilePath)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'had8778896hdw78g8w7v8w7g'
app.config['DEBUG'] = True
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# iniciar socketio
socketio = SocketIO(app, async_mode=None, logger=False, engineio_logger=False)
thread = Thread()
thread_stop_event = Event()


@app.route('/')
def index():
    # if not session.get("name"):
    #    return redirect("/login")
    # iniciar renderizacion de pagina
    global mensaje_global
    mensaje_global = "Conectado"
    global start_cameras
    start_cameras = 0
    return render_template('index.html')


def mostrar_patentes_all(draw, start, length, search, order, order_dir, columns):
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    num_filtrados = 0
    if order_dir == 'desc':
        order_dir = 'DESC'
    else:
        order_dir = 'ASC'

    if order == '0':
        order = 'id'
    elif order == '1':
        order = 'ip_cam'
    elif order == '2':
        order = 'imagen'
    elif order == '3':
        order = 'patente'
    elif order == '4':
        order = 'fecha'

    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    if search == '':
        # buscar ultimas 5000
        cursor.execute(
            "SELECT * FROM patentes ORDER BY " + order + " " + order_dir + " LIMIT " + str(start) + "," + str(length))
        rows = cursor.fetchall()
    else:
        # buscar por palabra clave
        cursor.execute(
            "SELECT * FROM patentes WHERE patente LIKE ? OR fecha LIKE ? ORDER BY " + order + " " + order_dir + " LIMIT ? OFFSET ?",
            ('%' + search + '%', '%' + search + '%', length, start))
        rows = cursor.fetchall()
        # numero de registros filtrados
        cursor.execute("SELECT COUNT(*) FROM patentes WHERE patente LIKE ? OR fecha LIKE ?",
                       ('%' + search + '%', '%' + search + '%'))
        num_filtrados = cursor.fetchone()[0]

    # obtener paginacion
    cursor.execute("SELECT COUNT(*) FROM patentes")
    total = cursor.fetchone()[0]
    if num_filtrados == 0:
        num_filtrados = total

    con.close()
    return rows, total, num_filtrados


@app.route('/search_fechas', methods=["GET"])
def search_fechas():
    if not session.get("name"):
        return 'error'
    fecha_inicial = request.args.get('fecha_inicial')
    fecha_final = request.args.get('fecha_final')
    # iniciar conexión
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    # seleccionar registros entre fechas
    cursor.execute("SELECT * FROM patentes WHERE fecha BETWEEN ? AND ?", (fecha_inicial, fecha_final))
    rows = cursor.fetchall()
    # crear un archivo excel cvs
    archivo = open(path + '/static/registros.csv', 'w', encoding='utf-8')
    archivo.write('id,ip_cam,imagen,patente,fecha\n')
    for row in rows:
        archivo.write(str(row[0]) + ',' + row[1] + ',' + row[2] + ',' + row[3] + ',' + row[4] + '\n')
    archivo.close()
    con.close()

    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    ahora = datetime.datetime.utcnow()

    no_patente = []
    error_patente = []
    patentes = []

    cursor.execute("SELECT COUNT(*) FROM patentes WHERE patente LIKE ? AND fecha BETWEEN ? AND ?",
                   ('%no patente%', fecha_inicial, fecha_final))
    num_filtrados = cursor.fetchone()[0]
    no_patente.append(num_filtrados)

    cursor.execute("SELECT COUNT(*) FROM patentes WHERE patente LIKE ? AND fecha BETWEEN ? AND ?",
                   ('%error%', fecha_inicial, fecha_final))
    num_filtrados = cursor.fetchone()[0]
    error_patente.append(num_filtrados)

    cursor.execute(
        "SELECT COUNT(*) FROM patentes WHERE patente NOT LIKE ? AND patente NOT LIKE ? AND fecha BETWEEN ? AND ?",
        ('%no patente%', '%error%', fecha_inicial, fecha_final))

    num_filtrados = cursor.fetchone()[0]
    patentes.append(num_filtrados)

    con.close()

    # retorna json
    return jsonify([{'no_patente': no_patente, 'error_patente': error_patente, 'patentes': patentes}])


@app.route('/estadisticas', methods=['GET'])
def estadisticas():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    # rango
    rango = request.args.get('rango')
    if rango == None:
        rango = '7'
    # rango en numero
    rango = int(rango)
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    ahora = datetime.datetime.utcnow()

    no_patente = []
    error_patente = []
    patentes = []
    for i in range(0, rango):
        # formato ahora d-m-y y restar 7 dias
        fecha_inicio = ahora - datetime.timedelta(days=i)
        fecha_inicio = fecha_inicio.strftime('%Y-%m-%d')
        cursor.execute("SELECT COUNT(*) FROM patentes WHERE patente LIKE ? AND fecha LIKE ?",
                       ('%no patente%', '%' + fecha_inicio + '%'))
        num_filtrados = cursor.fetchone()[0]
        no_patente.append(num_filtrados)

    for i in range(0, rango):
        # formato ahora d-m-y y restar 7 dias
        fecha_inicio = ahora - datetime.timedelta(days=i)
        fecha_inicio = fecha_inicio.strftime('%Y-%m-%d')
        cursor.execute("SELECT COUNT(*) FROM patentes WHERE patente LIKE ? AND fecha LIKE ?",
                       ('%error%', '%' + fecha_inicio + '%'))
        num_filtrados = cursor.fetchone()[0]
        error_patente.append(num_filtrados)

    for i in range(0, rango):
        # formato ahora d-m-y y restar 7 dias
        fecha_inicio = ahora - datetime.timedelta(days=i)
        fecha_inicio = fecha_inicio.strftime('%Y-%m-%d')
        cursor.execute("SELECT COUNT(*) FROM patentes WHERE fecha LIKE ? AND patente NOT LIKE ? AND patente NOT LIKE ?",
                       ('%' + fecha_inicio + '%', '%no patente%', '%error%'))

        num_filtrados = cursor.fetchone()[0]
        patentes.append(num_filtrados)

    con.close()

    # retorna json
    return jsonify([{'no_patente': no_patente, 'error_patente': error_patente, 'patentes': patentes}])


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # crear base de datos usuarios
        con = sqlite3.connect(path + '/base_datos.db')
        cursor = con.cursor()
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, password TEXT, estado INTEGER,rol TEXT)")
        con.commit()
        con.close()
        # obtener datos si no existe crear defaul admin admin
        con = sqlite3.connect(path + '/base_datos.db')
        cursor = con.cursor()
        # ver si existe algun usuario
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        num_usuarios = cursor.fetchone()[0]
        if num_usuarios == 0:
            # crear usuario admin
            cursor.execute("INSERT INTO usuarios (nombre, password, estado, rol) VALUES (?, ?, ?, ?)",
                           ('admin', 'admin', 1, 'admin'))
            con.commit()
        # obtener datos
        cursor.execute("SELECT * FROM usuarios WHERE estado = 1")
        rows = cursor.fetchall()
        con.close()
        # obtener datos del formulario
        email = request.form['email']
        # crear hash de la contraseña
        password = request.form['password']

        # verificar si existe el usuario
        for row in rows:
            if email == row[1] and password == row[2]:
                session['email'] = email
                # crear SESSION
                session['logged_in'] = True
                session['name'] = email
                session['rol'] = row[4]
                return 'true'
        # retornar json
        return jsonify([{'error': 'Usuario o contraseña incorrecta'}])
    else:
        return jsonify([{'error': 'Metodo no permitido'}])


# logout
@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('name', None)
    session.pop('rol', None)
    return redirect(url_for('index'))


# eliminar usuario
@app.route('/eliminar_usuario', methods=['GET', 'POST'])
def eliminar_usuario():
    # verificar que el usuario logeado sea admin
    if session['rol'] == 'admin':
        if request.method == 'POST':
            # obtener datos del formulario
            id_usuario = request.form['id_usuario']
            # eliminar usuario
            con = sqlite3.connect(path + '/base_datos.db')
            cursor = con.cursor()
            cursor.execute("DELETE FROM usuarios WHERE id = ?", (id_usuario,))
            con.commit()
            con.close()
            # retornar json status
            return jsonify({'status': 'ok'})
        else:
            return jsonify({'mensaje': 'Metodo no permitido'})
    else:
        return jsonify({'mensaje': 'No tiene permisos para eliminar usuarios'})


# allusers
@app.route('/allusers', methods=['GET'])
def allusers():
    # verificar si esta logeado
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    # obtener datos
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    # obtener datos
    cursor.execute("SELECT * FROM usuarios")
    rows = cursor.fetchall()
    con.close()
    # data
    data = []
    # recorrer y asignar nombre a nombre
    for row in rows:
        data.append({'id': row[0], 'nombre': row[1], 'password': row[2], 'estado': row[3], 'rol': row[4]})
    # retornar json
    return jsonify(data)


# edituser
@app.route('/edituser', methods=['GET', 'POST'])
def edituser():
    # verificar si esta logeado
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    if request.method == 'POST':
        # obtener datos del formulario
        id = request.form['id']
        nombre = request.form['nombre']
        password = request.form['password']
        estado = request.form['estado']
        rol = request.form['rol']
        # crear base de datos usuarios
        con = sqlite3.connect(path + '/base_datos.db')
        cursor = con.cursor()
        # actualizar datos
        cursor.execute("UPDATE usuarios SET nombre = ?, password = ?, estado = ?, rol = ? WHERE id = ?",
                       (nombre, password, estado, rol, id))
        con.commit()
        con.close()
        # retornar json
        return jsonify({'success': 'true'})
    else:
        return jsonify([{'error': 'Metodo no permitido'}])


# adduser
@app.route('/adduser', methods=['GET', 'POST'])
def adduser():
    # verificar si esta logeado
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    if request.method == 'POST':
        # obtener datos del formulario
        nombre = request.form['nombre']
        password = request.form['password']
        estado = 1
        rol = 'user'
        # crear base de datos usuarios
        con = sqlite3.connect(path + '/base_datos.db')
        cursor = con.cursor()
        # insertar datos
        cursor.execute("INSERT INTO usuarios (nombre, password, estado, rol) VALUES (?, ?, ?, ?)",
                       (nombre, password, estado, rol))
        con.commit()
        con.close()
        # retornar json
        return jsonify({'success': 'true'})
    else:
        return jsonify({'mensaje': 'Metodo no permitido'})


@app.route('/all_lista_negra', methods=['GET'])
def all_lista_negra():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    # consultar en base de datos
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    # crear tabla lista negra si no existe
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS lista_negra (id INTEGER PRIMARY KEY AUTOINCREMENT, patente TEXT, comentario TEXT, fecha TEXT)")
    con.commit()
    # crear columna si no exite en la tabla llamada comentario tipo texto
    if not column_exists('lista_negra', 'comentario'):
        cursor.execute("ALTER TABLE lista_negra ADD COLUMN comentario TEXT")
        con.commit()

    cursor.execute("SELECT * FROM lista_negra")
    rows = cursor.fetchall()
    con.close()
    return jsonify(rows)


def column_exists(table, column):
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    cursor.execute("PRAGMA table_info({})".format(table))
    data = cursor.fetchall()
    for d in data:
        if d[1] == column:
            return True
    return False


@app.route('/delete_lista_negra', methods=['GET'])
def delete_lista_negra():
    # detectar metodo
    if request.method == 'POST':
        # obtener datos del formulario
        id = int(request.form['id'])
    else:
        # obtener datos del formulario
        id = int(request.args.get('id'))

    # consultar en base de datos
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    # borrar registro
    cursor.execute("DELETE FROM lista_negra WHERE id = ?", (id,))
    con.commit()
    con.close()
    return jsonify(True)


@app.route('/add_lista_negra', methods=['GET'])
def add_lista_negra():
    # consultar en base de datos

    fecha_registro = time.strftime("%Y-%m-%d %H:%M:%S")
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    cursor.execute("INSERT INTO lista_negra (patente, comentario, fecha) VALUES (?,?,?)",
                   (request.args.get('patente'), request.args.get('comentario'), fecha_registro))
    con.commit()
    con.close()
    return jsonify(True)


@app.route('/update_lista_negra', methods=['POST'])
def update_lista_negra():
    # consultar en base de datos
    con = sqlite3.connect(path + '/base_datos.db')
    cursor = con.cursor()
    cursor.execute("UPDATE lista_negra SET comentario = ? WHERE id = ?",
                   (request.form['comentario'], request.form['id']))
    con.commit()
    con.close()
    return jsonify(True)


@app.route('/camaras')
def camarasName():
    # buscar archivos .cam
    camaras = []
    for file in os.listdir(path + '/static'):
        if file.endswith(".cam"):
            # obtener su primera linea
            with open(path + '/static/' + file) as f:
                line = f.readline()
                # parserar la linea por ","
                line = line.split(',')
                # agregar al array
                camaras.append({'ip': line[0], 'nombre': line[4]})

    return jsonify(camaras)


@app.route('/all_register', methods=['GET'])
def all_register():
    # &draw=10&columns[0][data]=id&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=true&columns[0][search][value]=&columns[0][search][regex]=false&columns[1][data]=fecha&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=false&columns[2][data]=patente&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=false&columns[3][data]=imagen&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&columns[3][search][regex]=false&order[0][column]=0&order[0][dir]=desc&start=0&length=10&search[value]=d&search[regex]=false&_=1658168704091
    # obtener busqueda de datos
    draw = request.args.get('draw')
    start = request.args.get('start')
    length = request.args.get('length')
    search = request.args.get('search[value]')
    columns = request.args.get('columns')
    order = request.args.get('order[0][column]')
    order_dir = request.args.get('order[0][dir]')
    rows, total, num_filtrados = mostrar_patentes_all(draw, start, length, search, order, order_dir, columns)

    # buscar archivos .cam
    camaras = []
    for file in os.listdir(path + '/static'):
        if file.endswith(".cam"):
            # obtener su primera linea
            with open(path + '/static/' + file) as f:
                line = f.readline()
                # parserar la linea por ","
                line = line.split(',')
                # agregar al array
                camaras.append({'ip': line[0], 'nombre': line[4]})

    # formatear para datatables
    data = []
    for row in rows:
        # buscar en camaras para obtener nombre
        nombre = ''
        for camara in camaras:
            if camara['ip'] == row[1]:
                nombre = camara['nombre']
                break

        data.append(
            {"id": row[0], "ip_cam": nombre, "fecha": row[2], "patente": row[3], "imagen": row[4], "ip": row[1]})
    return jsonify({'data': data, 'draw': draw, 'recordsTotal': total, 'recordsFiltered': num_filtrados})


# arrancar servidor local
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000)
