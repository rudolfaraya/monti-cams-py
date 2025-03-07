var model = undefined;
var objeto_camara = [];
var aumento = 1.8;
var data_camara_temp = "";
var total_camaras = 0;
var openalpr = false;
var socket = io.connect('http://' + document.domain + ':' + location.port + '/camaras');
socket.emit('reiniciar', {
    message: 'reiniciar'
});

function inicia_camaras() {

    let url = '/static/camaras.json';

    fetch(url)
        .then(res => res.json())
        .then(function(out) {

            //console.log(out);

            readCams(out.camaras)

        })

    .catch(console.error())

}

// funcion para editar tr de table de camaras

function readCams(cam) {
    console.log(cam);
    let camaras = cam;
    let inicial = 5;
    let dif = 50;
    let link = "";
    crear_feed(camaras.length);
    for (let i = 0; i < camaras.length; i++) {
        setTimeout(function() {

            if (camaras[i].ip_camara == "1" || camaras[i].ip_camara == "2") {
                // convertir string a numero para poder usarlo como id
                link = parseInt(camaras[i].ip_camara);
                //link = 'video.avi';
            } else {
                var streaming = '0';
                link = 'rtsp://' + camaras[i].usuario_camara + ':' + camaras[i].password_camara + '@' + camaras[i].ip_camara + ':' + camaras[i].puerto_camara + '/cam/realmonitor?channel=' + camaras[i].canal_camara + '&subtype=' + streaming + '&unicast=true&proto=Onvif';

            }


            let botones = '<button class="btn btn-warning btn-sm" onclick="editarCamara(this, ' + (i) + ')"><i class="fas fa-edit"></i></button> <button class="btn btn-danger btn-sm" onclick="eliminarCamara(this)"><i class="fa fa-trash" aria-hidden="true"></i></button>'
            document.getElementById("camaras-table").insertRow(-1).innerHTML = '<td>' + camaras[i].nombre_camara + '</td><td>' + camaras[i].ip_camara + '</td><td>' + camaras[i].puerto_camara + '</td><td>' + camaras[i].canal_camara + '</td><td>' + camaras[i].usuario_camara + '</td><td>' + camaras[i].password_camara + '</td><td>' + botones + '</td>';

            conectarCamara(link, String(i + 1));

            total_camaras = i + 1;
        }, inicial);
        inicial += dif;

    }

}







function guardarCambios(actual, id) {
    let botones = '<button class="btn btn-warning btn-sm" onclick="editarCamara(this, ' + id + ')"><i class="fas fa-edit"></i></button> <button class="btn btn-danger btn-sm" onclick="eliminarCamara(this)"><i class="fa fa-trash" aria-hidden="true"></i></button>'
    var datos = [];
    var td = actual.parentNode;
    var tr = td.parentNode;
    var table = tr.parentNode;
    var id = tr.rowIndex - 1;

    //console.log(id);

    // cambiar todos los tr a no editables
    for (var i = 1; i < table.rows.length; i++) {
        table.rows[i].classList.remove("table-warning");
        // remover td editables
        for (var j = 0; j < table.rows[i].cells.length; j++) {
            // detectar la ultima columna
            if (j == table.rows[i].cells.length - 1) {
                table.rows[i].cells[j].innerHTML = botones;
            } else {
                if (i == id) {
                    datos.push(table.rows[i].cells[j].innerHTML);
                }
                /// 
                table.rows[i].cells[j].contentEditable = false;
            }

        }
    }

    socket.emit('update', {
        datos: datos,
        num: (id - 1)
    });

    console.log(id - 1);
    console.log(datos);

}



function updateTextInputCanal(val, id) {
    document.getElementById('canal_' + id).value = val;
}




function cancelarCamara(actual, id) {
    let botones = '<button class="btn btn-warning btn-sm" onclick="editarCamara(this, ' + id + ')"><i class="fas fa-edit"></i></button> <button class="btn btn-danger btn-sm" onclick="eliminarCamara(this)"><i class="fa fa-trash" aria-hidden="true"></i></button>';
    var td = actual.parentNode;
    var tr = td.parentNode;
    var table = tr.parentNode;
    var id = tr.rowIndex;
    // cambiar todos los tr a no editables
    for (var i = 1; i < table.rows.length; i++) {
        table.rows[i].classList.remove("table-warning");
        // remover td editables
        for (var j = 0; j < table.rows[i].cells.length; j++) {
            // detectar la ultima columna
            if (j == table.rows[i].cells.length - 1) {
                table.rows[i].cells[j].innerHTML = botones;
            } else {

                if (i == (id - 1)) {
                    table.rows[i].cells[j].innerHTML = data_camara_temp[j];
                }
                table.rows[i].cells[j].contentEditable = false;
            }


        }
    }





    console.log(data_camara_temp);

}




function editarCamara(actual, id) {

    let botones = '<button class="btn btn-warning btn-sm" onclick="editarCamara(this, ' + id + ')"><i class="fas fa-edit"></i></button> <button class="btn btn-danger btn-sm" onclick="eliminarCamara(this)"><i class="fa fa-trash" aria-hidden="true"></i></button>';
    var td = actual.parentNode;
    var tr = td.parentNode;
    var table = tr.parentNode;
    var id = tr.rowIndex;
    var nuevos_botones = '<button class="btn btn-success btn-sm" onclick="guardarCambios(this, ' + id + ')" ><i class="fas fa-save"></i></button> <button class="btn btn-secondary btn-sm" onclick="cancelarCamara(this, ' + id + ')" ><i class="fa fa-times" aria-hidden="true"></i></button>';
    // transformar celdas a arreglo array

    data_camara_temp = [];
    // cambiar todos los tr a no editables
    for (var i = 1; i < table.rows.length; i++) {
        table.rows[i].classList.remove("table-warning");
        // remover td editables
        for (var j = 0; j < table.rows[i].cells.length; j++) {
            // detectar la ultima columna
            if (j == table.rows[i].cells.length - 1) {
                table.rows[i].cells[j].innerHTML = botones;
            } else {
                table.rows[i].cells[j].contentEditable = false;
            }
        }
    }
    //cambiar estilo de tr
    tr.classList.add("table-warning");
    // buscar las filas activas


    tr.cells[6].innerHTML = nuevos_botones;
    // cambiar tds a editables
    for (var i = 0; i < (tr.cells.length - 1); i++) {
        tr.cells[i].contentEditable = true;

        data_camara_temp.push(tr.cells[i].innerHTML);
    }

}


var loadPage = document.getElementById("loading-div");
cocoSsd.load().then(function(loadedModel) {


    model = loadedModel;
    loadPage.innerHTML = "";

    // const model_d = tf.sequential();
    //  model_d.add(tf.layers.dense({ units: 1, inputShape: [10], activation: 'sigmoid' }));
    //  const saveResult = model_d.save('downloads://mymodel');
    // This will trigger downloading of two files:
    //   'mymodel.json' and 'mymodel.weights.bin'.
    //  console.log(saveResult);


});



function crear_feed(cant) {
    var div_template = "";
    var div_template_recortes = "";
    var feed_camaras = document.getElementById("feed_camaras");
    var recortes_camaras = document.getElementById("recortes");
    for (var i = 0; i < cant; i++) {
        var n = i + 1;
        div_template_recortes += '<div class="col-2">' +
            '<canvas id="canvas_auto_snap' + n + '"  class="img-fluid"  style="display:none"></canvas>' +
            '<div id="img_container_' + n + '"  class="img-fluid"></div>' +
            '<br><canvas id="canvasDetection' + n + '"  class="img-fluid" ></canvas></div>';

        div_template += '<div class="col-6 col-md-3 mb-1">' +
            '<div id="loading-result-camara' + n + '" style="position: absolute; height: 100%;"></div>' +
            '<img src="static/assets/img/loading.gif"  class="img-fluid gris" id="camara' + n + '"  style="max-height: 150px; "> <br><small> <span id="result-camara' + n + '"></span> | <span id="result_cam_' + n + '">Ready</span></small></div>';
    }

    feed_camaras.innerHTML = div_template;
    recortes_camaras.innerHTML = div_template_recortes;

}




var socketMovimiento = io.connect('http://' + document.domain + ':' + location.port + '/movimiento');
socketMovimiento.on("movimiento", function(msg) {
    if (msg) {
        //var resultMovimiento = document.getElementById("detecta_" + msg.camara);
        //resultMovimiento.innerHTML = msg.num;
        //iniciar(msg.camara, 0);
        //detectaTf(msg.num);

    }

});

var socketBd = io.connect('http://' + document.domain + ':' + location.port + '/bdpatentes');
socketBd.on("bdpatentes", function(data) {
    if (data) {

        cargaPatentes(data, 'tabla_datos', false);


    }

});

socketBd.on("bdpatentesall", function(data) {
    if (data) {

        cargaPatentes(data, 'tabla_datos_all', true);

    }

});

// funcion para agregar un 0 a la izquierda
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


function buscarAll() {
    var fecha = $("#fecha-buscar").val();
    var patente = $("#patente-buscar").val();
    if (fecha == "") {
        // indicar la fecha de hoy
        fecha = new Date();

        var mes = fecha.getMonth() + 1;
        var dia = fecha.getDate();

        // formato a mes y dia
        var mes = pad(mes, 2);
        var dia = pad(dia, 2);
        var ano = fecha.getFullYear();

        var fecha_actual = dia + "-" + mes + "-" + ano;
        fecha = fecha_actual;
        $("#fecha-buscar").val(fecha_actual);
    }

    $.ajax({
        url: "buscarCamaras",
        type: 'GET',
        data: {
            fecha: fecha,
            patente: patente
        },
        success: function(data) {
            if (data) {
                console.log("Ok");
            }
        }
    });



}

function cargaPatentes(data, tabla_id, status) {
    $("#" + tabla_id).DataTable().destroy();
    // agregar patentes a la tabla
    var tabla_patentes = document.getElementById(tabla_id + "_body");
    var patentes = data.patentes;
    console.log(patentes);
    var html = "";
    for (var i = 0; i < patentes.length; i++) {
        html += '<tr>' +
            '<td><img src="static/data/' + patentes[i][5].substr(0, 5) + '/' + patentes[i][1] + '" class="img-fluid" style="max-width: 80px;"  onclick="readDataFull(\'static/data/' + patentes[i][5].substr(0, 5) + '/' + patentes[i][1] + '\', \'' + patentes[i][2] + '\')" data-bs-toggle="modal" data-bs-target="#fullVehiculo"></td>' +
            '<td>' + patentes[i][2] + '</td>' +
            '<td>' + patentes[i][5] + '</td>' +

            '</tr>';
    }
    tabla_patentes.innerHTML = html;
    buscaPatentes(tabla_id, status);
}

function readDataFull(urlImg, patente) {
    var tabla = document.getElementById('detalles-captura-cuerpo');
    var html = "";

    html += '<tr>';
    html += '<td>Imagen</td><td><img src="' + urlImg + '" class="img-fluid"></td>';
    html += '</tr>';

    tabla.innerHTML = html;
}

function buscaPatentes(id, status) {
    $('#' + id).DataTable({
        "language": {

            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
            "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
            "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
            "sInfoPostFix": "",
            "sSearch": "Filtrar:",
            "sUrl": "",
            "sInfoThousands": ",",
            "sLoadingRecords": "Cargando...",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": '>>',
                "sPrevious": '<<'
            },
            "oAria": {
                "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                "sSortDescending": ": Activar para ordenar la columna de manera descendente"
            }

        },
        "destroy": true,
        "searching": status,
        "pageLength": 5,
        "lengthChange": false,
    });

}

function conectarCamara(cam_in, num_in) {
    // enviar mensaje por socket al servidor 
    socket.emit('mensaje', {
        message: 'activar streaming camara' + num_in,
        cam: cam_in,
        num: num_in
    });


    const image_elem = document.getElementById("camara" + num_in);
    socket.on("camara" + num_in, function(msg) {
        if (msg) {
            const arrayBufferView = new Uint8Array(msg.buff);
            const blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
            image_elem.src = URL.createObjectURL(blob);
        }

    });
}



function detectaTf(id) {


    var hoy = new Date();
    var mes = (hoy.getMonth() + 1);
    if (mes < 10) {
        mes = "0" + mes;
    }
    var dia = hoy.getDate();
    if (dia < 10) {
        dia = "0" + dia;
    }
    var fecha = dia + "-" + mes + "-" + hoy.getFullYear();
    var hora = fecha + " " + hoy.getHours() + ':' + identificaMinuto(hoy.getMinutes()) + ':' + identificaMinuto(hoy.getSeconds());
    var img = document.getElementById("camara" + id);
    var camara_imagen = document.getElementById('canvas_auto_snap' + id);
    var camara_procesada = document.getElementById('canvasDetection' + id);
    var imagen_canvas_procesada = camara_procesada.getContext('2d');
    var imagen_canvas = camara_imagen.getContext('2d');
    var img = document.getElementById("camara" + id);
    var width = img.width;
    var height = img.height;
    let ratio_w = img.naturalWidth / width;
    let ratio_h = img.naturalHeight / height;
    let margen = width / 8;

    let marco_base = '<div style="border: 2px solid  #40ffa7; color: #fff; position: absolute; top:  ' + margen + 'px; left: ' + margen + 'px; width: ' + Math.round(width - (margen * 2)) + 'px; height: ' + Math.round(height - (margen * 2)) + 'px;">   </div>';

    model.detect(img).then(function(predictions) {
        var html = marco_base;
        var html_obj = "";
        children.splice(0);



        for (let n = 0; n < predictions.length; n++) {
            if (predictions[n].score > 0.66) {

                let tam_ratio = Math.round((predictions[n].bbox[2] / img.width) * 100);

                // determinar aspecto frontal excepto bus 
                let tam_ratio_box = (predictions[n].bbox[3] / predictions[n].bbox[2]);
                console.log(tam_ratio_box);
                console.log(predictions[n].bbox[3], predictions[n].bbox[2]);

                if (tam_ratio > 44 && predictions[n].bbox[0] > Math.round(margen / 2.5)) {
                    if (predictions[n].class !== "person") {
                        if (document.getElementById("result_cam_" + id).innerHTML == "Ready") {
                            document.getElementById("result_cam_" + id).innerHTML = "Leyendo...";
                            imagen_canvas.clearRect(0, 0, Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h));

                            imagen_canvas_procesada.clearRect(0, 0, Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h));

                            camara_imagen.width = (Math.round(predictions[n].bbox[2] * ratio_w));
                            camara_imagen.height = (Math.round(predictions[n].bbox[3] * ratio_h));



                            camara_procesada.width = (Math.round(predictions[n].bbox[2] * ratio_w));
                            camara_procesada.height = (Math.round(predictions[n].bbox[3] * ratio_h));


                            imagen_canvas.drawImage(img, Math.round(predictions[n].bbox[0] * ratio_w), Math.round(predictions[n].bbox[1] * ratio_h), Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h), 0, 0, Math.round((predictions[n].bbox[2] * ratio_w)), Math.round((predictions[n].bbox[3] * ratio_h)));
                            imagen_canvas_procesada.drawImage(camara_imagen, 0, 0, Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h));


                            var imageDataURL = camara_imagen.toDataURL('image/jpeg');



                            if (openalpr == true) {

                                OpenALPRAdapter().retrievePlate(imageDataURL).then(function(plate) {
                                    // verifica que hay una placa
                                    if (plate.results.length > 0) {
                                        for (var key in plate.results) {
                                            var result = plate.results[key];

                                            socket.emit('insertar_patente', {
                                                imagen: imageDataURL,
                                                patente: result.plate,
                                                marca: _.get(result, 'vehicle.make[0].name', ''),
                                                modelo: _.get(result, 'vehicle.body_type[0].name', ''),
                                                fecha: hora


                                            });

                                        }
                                        setTimeout(function() {
                                            document.getElementById("result_cam_" + id).innerHTML = "Ready";
                                        }, 1400);

                                    } else {


                                        socket.emit('insertar_patente', {
                                            imagen: imageDataURL,
                                            patente: "NO DETECTADA",
                                            marca: "NO DETECTADA",
                                            modelo: "NO DETECTADA",
                                            fecha: hora


                                        });
                                        setTimeout(function() {
                                            document.getElementById("result_cam_" + id).innerHTML = "Ready";
                                        }, 1000);


                                    }
                                });
                            }





                        }
                    } else {

                        imagen_canvas.clearRect(0, 0, Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h));
                        camara_imagen.width = (Math.round(predictions[n].bbox[2] * ratio_w));
                        camara_imagen.height = (Math.round(predictions[n].bbox[3] * ratio_h));
                        imagen_canvas.drawImage(img, Math.round(predictions[n].bbox[0] * ratio_w), Math.round(predictions[n].bbox[1] * ratio_h), Math.round(predictions[n].bbox[2] * ratio_w), Math.round(predictions[n].bbox[3] * ratio_h), 0, 0, Math.round((predictions[n].bbox[2] * ratio_w)), Math.round((predictions[n].bbox[3] * ratio_h)));

                    }
                }

                let nombre_obj = predictions[n].class;
                var color = detectaAuto(nombre_obj);
                nombre_obj = getNombre(nombre_obj);
                let details = nombre_obj;
                html_obj += details + '<br>';
                var tamano = "";
                //    ' + details + '

                html += '<div style="border: 2px solid ' + color + ';color: #fff; position: absolute; top: ' + Math.round(predictions[n].bbox[1]) + 'px; left: ' + Math.round(predictions[n].bbox[0]) + 'px; width: ' + Math.round(predictions[n].bbox[2]) + 'px; height: ' + Math.round(predictions[n].bbox[3]) + 'px;"> ' + details + '   ' + tamano + ' </div>'




            }
        }
        document.getElementById("loading-result-camara" + id).innerHTML = html;
        document.getElementById("result-camara" + id).innerHTML = hora;

    });

}






function anprLocal(image) {





}



window.onload = function() {
    //document.oncontextmenu = function(){return false}
    setTimeout(function() {
        //cargaCamaras(2);
    }, 8000);
    inicia_camaras();
}

var client = {
    /// compatibilidad de forma
    'country': 'eu'
}

function cargaCamaras(camaras) {
    let inicial = 180;
    let dif = 410;
    for (let i = 1; i < (camaras + 1); i++) {

        iniciar(i, inicial);
        console.log(i);
        inicial += dif;
    }
}


function identificaMinuto(minuto) {
    switch (minuto) {
        case 0:
            return "00";
        case 1:
            return "01";
            break;
        case 2:
            return "02";
            break;
        case 3:
            return "03";
            break;
        case 4:
            return "04";
            break;
        case 5:
            return "05";
            break;
        case 6:
            return "06";
            break;
        case 7:
            return "07";
            break;
        case 8:
            return "08";
            break;
        case 9:
            return "09";
            break;
        default:
            return minuto;
            break;
    }
}

function reconoce(event) {
    console.log(event.target.id);
    model.detect(document.querySelector("#camara1")).then(function(predictions) {
        console.log(predictions);
    });
}

var children = [];
var paginaActiva = 1;
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        paginaActiva = 0;
    } else {
        paginaActiva = 1;
    }
}, false);


function resizeDraggable(id) {
    var ele = document.getElementById(id);
    var width = ele.offsetWidth;
    var height = ele.offsetHeight;
    var img = document.getElementById("camara" + id);
    var width_img = img.width;
    var height_img = img.height;
    var ratio = width_img / height_img;
    var new_width = width;
    var new_height = width / ratio;
    if (new_height > height) {
        new_height = height;
        new_width = height * ratio;
    }


}

function eliminarCamara(actual) {
    var td = actual.parentNode;
    var tr = td.parentNode;
    var table = tr.parentNode;
    table.removeChild(tr);
}

function agregarCamara() {
    let nombre = document.getElementById("nombre_camara").value;
    let ip = document.getElementById("ip_camara").value;
    let puerto = document.getElementById("puerto_camara").value;
    let usuario = document.getElementById("usuario_camara").value;
    let password = document.getElementById("password_camara").value;
    let canal = document.getElementById("canal_camara").value;

    if (nombre == "" || ip == "" || puerto == "" || usuario == "" || password == "" || canal == "") {

        alert("Complete todos los campos");
        return;

    } else {

        nombre.value = "";
        ip.value = "";
        puerto.value = "";
        usuario.value = "";
        password.value = "";
        canal.value = "";

        let botones = '<button class="btn btn-warning btn-sm" onclick="editarCamara()"><i class="fas fa-edit"></i></button> <button class="btn btn-danger btn-sm" onclick="eliminarCamara(this)"><i class="fa fa-trash" aria-hidden="true"></i></button>'
        document.getElementById("camaras-table").insertRow(-1).innerHTML = '<td>' + nombre + '</td><td>' + ip + '</td><td>' + puerto + '</td><td>' + canal + '</td><td>' + usuario + '</td><td>' + password + '</td><td>' + botones + '</td>';
        socket.emit('addCamara', {
            ip_camara: ip,
            puerto_camara: puerto,
            usuario_camara: usuario,
            password_camara: password,
            nombre_camara: nombre,
            canal_camara: canal
        });
        inicia_camaras();

        let link = 'rtsp://' + usuario + ':' + password + '@' + ip + ':' + puerto + '/cam/realmonitor?channel=' + canal + '&subtype=0&unicast=true&proto=Onvif';

        total_camaras = total_camaras + 1;
        console.log(total_camaras);
        conectarCamara(link, String(total_camaras));


    }
}


var ipv4_address = $('#ip_camara');
ipv4_address.inputmask({
    alias: "ip",
    greedy: false //The initial mask shown will be "" instead of "-____".
});




function verificaLectura(ancho, id) {
    switch (id) {
        case 1:
            if (ancho == anterior_ancho_cam1) {
                return false;
            } else {
                anterior_ancho_cam1 = ancho;
                return true;
            }
            break;
        case 2:
            if (ancho == anterior_ancho_cam2) {
                return false;
            } else {
                anterior_ancho_cam2 = ancho;
                return true;
            }
            break;
        case 3:
            if (ancho == anterior_ancho_cam3) {
                return false;
            } else {
                anterior_ancho_cam3 = ancho;
                return true;
            }
            break;
        case 4:
            if (ancho == anterior_ancho_cam4) {
                return false;
            } else {
                anterior_ancho_cam4 = ancho;
                return true;
            }
            break;
    }
}

function updateTextInput(val, id) {
    document.getElementById('rango_' + id).value = val;
}


function obtieneDatos(patente) {

    $.ajax({
        url: "https://www.iscreen.cl/rut.php?pat=" + patente,
        type: "GET",
        processData: false,
        contentType: false,
    }).done(function(respond) {
        var datos = respond;
        document.getElementById("tabla_datos").insertRow(1).innerHTML = datos;
    });

}


function saveImage(id) {
    var camara_imagen = document.getElementById('canvas_auto_snap' + id);
    var canvasData = canvas.toDataURL("image/png");
    var xmlHttpReq = false;

    if (window.XMLHttpRequest) {
        ajax = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        ajax = new ActiveXObject("Microsoft.XMLHTTP");
    }

    ajax.open("POST", "testSave.php", false);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.onreadystatechange = function() {
        console.log(ajax.responseText);
    }
    ajax.send("imgData=" + canvasData);
}



function contrastImage(imageData, contrast) {
    var data = imageData.data;
    contrast *= 2.55;
    var factor = (255 + contrast) / (255.01 - contrast);

    for (var i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128; //r value
        data[i + 1] = factor * (data[i + 1] - 128) + 128; //g value
        data[i + 2] = factor * (data[i + 2] - 128) + 128; //b value

    }
    return imageData;
}



function leer(imagen) {

    Tesseract.recognize(imagen, 'eng', { logger: m => console.log(m) })
        .then(({ data: { text } }) => {
            alert(text);
        });

}



function detectaAuto(data) {

    if (data == "car") {
        return '#00FF0E';
    } else {
        return '#ff001d';
    }

}

function getNombre(data) {
    switch (data) {
        case "apple":
            nombre_obj_c = "Manzana";
            break;
        case "train":
            nombre_obj_c = "Tren";
            break;
        case "person":
            nombre_obj_c = 'Persona';
            break;
        case "dog":
            nombre_obj_c = "Perro";
            break;
        case "car":
            nombre_obj_c = 'Auto';
            break;
        case "truck":
            nombre_obj_c = 'Camión';
            break;
        case "bus":
            nombre_obj_c = 'Bus';
            break;
        case "cup":
            nombre_obj_c = "Taza";
            break;
        case "couch":
            nombre_obj_c = "Sofá";
            break;
        case "cell phone":
            nombre_obj_c = "Celular";
            break;
        case "mouse":
            nombre_obj_c = "Mouse";
            break;
        case "destokp":
            nombre_obj_c = "Computador";
            break;
        case "tv":
            nombre_obj_c = "Tv";
            break;
        case "table":
            nombre_obj_c = "Mesa";
            break;
        case "couch":
            nombre_obj_c = "Sillón";
            break;
        case "chair":
            nombre_obj_c = "Silla";
            break;

        default:
            return data;
            break;
    }

    return nombre_obj_c;
}