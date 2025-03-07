'use strict'

function OpenALPRAdapterMASTER() {
    // Adapters
    var adapters = {
        'start': function() {
            return start()
        }
    }


    var start = function() {

        /// iniciar el proceso de reconocimiento de placas
        $(document).on('change', 'input', function(input) {
            runOpenALPR(input)
        })
    }

    var runOpenALPR = function(input) {
        appendMessage('Leyendo matricula...')
        showImage(input)
    }

    var showImage = function(input) {
        if (!window.FileReader) {
            appendMessage('El navegador no es compatible...')
            return
        }

        if (input.currentTarget.files && input.currentTarget.files[0]) {
            var reader = new FileReader()

            reader.onload = function(e) {
                var imageDataURL = e.target.result
                $('#uploadedImage').attr('src', imageDataURL)
                OpenALPRAdapter().retrievePlate(imageDataURL)
                    .then(function(response) {
                        cloudAPISuccess(response)
                    })
                    .catch(function(err) {
                        cloudAPIError(err)
                    })
            }
            reader.readAsDataURL(input.currentTarget.files[0])
        }
    }

    var cloudAPIError = function(err) {
        if (err && err.responseText) {
            appendMessage('Falla al recibir datos ' + err.responseText)
        } else {
            appendMessage('Error temporal', err)
        }
    }

    var cloudAPISuccess = function(response) {
        if (!response.results || response.results.length === 0) {
            appendMessage('Paleta no encontrada en imagen.')
            return
        }
        for (var key in response.results) {
            var result = response.results[key]
            appendMessage('Patente: ' + result.plate)
            appendMessage('Marca: ' + _.get(result, 'vehicle.make[0].name', ''))
        }

        var creditsRemaining = response.credits_monthly_total - response.credits_monthly_used
            //appendMessage('Credits remaining: ' + creditsRemaining)
    }

    var appendMessage = function(message) {
            console.log(message)
            $('#messages').append('<div class="message">' + message + '</div>')
        }
        // retornar adapter para ser usado
    return adapters
}

window.exports = OpenALPRAdapterMASTER
    // End A (Adapter)

$(document).ready(function() {
    OpenALPRAdapterMASTER().start()
})