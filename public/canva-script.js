import { batimentData ,getWeatherData} from './main.js';
var batiment_Data = null;
var getWeather_Data = null;
// var dataMeteo = null;
// var Collecteau = null;
// var energyDataAsync = null;

$(document).ready(async function() {
    batiment_Data = await batimentData("24e124725c378643");
    getWeather_Data = await getWeatherData();
    function makeDraggableAndResizable(element) {
        element.draggable({
            containment: "#editor",
            stop: function(event, ui) {
                // Convert position to percentage
                const parentWidth = $('#editor').width();
                const parentHeight = $('#editor').height();
                const leftPercent = (ui.position.left / parentWidth) * 100;
                const topPercent = (ui.position.top / parentHeight) * 100;
                $(this).css({
                    'left': leftPercent + '%',
                    'top': topPercent + '%',
                    'position': 'absolute'
                });
            }
        }).resizable({
            containment: "#editor",
            stop: function(event, ui) {
                // Convert size to percentage
                const parentWidth = $('#editor').width();
                const parentHeight = $('#editor').height();
                const widthPercent = (ui.size.width / parentWidth) * 100;
                const heightPercent = (ui.size.height / parentHeight) * 100;
                $(this).css({
                    'width': widthPercent + '%',
                    'height': heightPercent + '%'
                });
            }
        }).css('position', 'absolute'); // Ensure new elements have absolute position
    }

    $('.element-button').click(function() {
        const elementType = $(this).data('element');
        let newElement;
        switch (elementType) {
            case 'BatimentCo2':
                newElement = $(`<h3 contenteditable="true" class="batiment-co2">${batiment_Data.co2}</h3>`);
                break;
            case 'BatimentBattery':
                newElement = $(`<h3 contenteditable="true" class="batiment-battery">${batiment_Data.battery}</h3>`);
                break;
            case 'BatimentHum':
                newElement = $(`<h3 contenteditable="true" class="batiment-humidity">${batiment_Data.humidity}</h3>`);
                break;
            case 'BatimentTemp':
                newElement = $(`<h3 contenteditable="true" class="batiment-temperature">${batiment_Data.temperature}</h3>`);
                break;
            case 'MeteoTemp':
                newElement = $(`<h3 contenteditable="true" class="Weather-temperature">${getWeather_Data.temperature}</h3>`);
                break;
            case 'MeteoTempMax':
                newElement = $(`<h3 contenteditable="true" class="Weather-tempMax">${getWeather_Data.tempMax}</h3>`);
                break;
            case 'MeteoTempMin':
                newElement = $(`<h3 contenteditable="true" class="Weather-tempMin">${getWeather_Data.tempMin}</h3>`);
                break;
            case 'MeteoHum':
                newElement = $(`<h3 contenteditable="true" class="Weather-humidity">${getWeather_Data.humidity}</h3>`);
                break;
            case 'h1':
                newElement = $('<h1 contenteditable="true">Heading h1</h1>');
                break;
            case 'h2':
                newElement = $('<h2 contenteditable="true">Heading h2</h2>');
                break;
            case 'h3':
                newElement = $('<h3 contenteditable="true">Heading h3</h3>');
                break;
            case 'h4':
                newElement = $('<h4 contenteditable="true">Heading h4</h4>');
                break;
            case 'h5':
                newElement = $('<h5 contenteditable="true">Heading h5</h5>');
                break;
            case 'p':
                newElement = $('<p contenteditable="true">Paragraph - Lorem Ipsum dolor sit Aenean commodo ligula natoque penatibus et</p>');
                break;
            case 'overline':
                newElement = $('<p contenteditable="true" style="text-decoration: overline;">Text Overline</p>');
                break;
            case 'underline':
                newElement = $('<p contenteditable="true" style="text-decoration: underline;">Text Underline</p>');
                break;
            case 'line-through':
                newElement = $('<p contenteditable="true" style="text-decoration: line-through;">Text Line through</p>');
                break;
            case 'bold':
                newElement = $('<p contenteditable="true" style="font-weight: bold;">Text Bold</p>');
                break;
            case 'italic':
                newElement = $('<p contenteditable="true" style="font-style: italic;">Text Italic</p>');
                break;
            case 'rectangle':
                newElement = $('<div class="shape-element" style="width: 100px; height: 100px; background-color: #ddd;"></div>');
                break;
            case 'circle':
                newElement = $('<div class="shape-element" style="width: 100px; height: 100px; background-color: #ddd; border-radius: 50%;"></div>');
                break;
            case 'img':
                newElement = $('<img src="https://via.placeholder.com/150" alt="Placeholder Image" style="width: 100px; height: 100px;">');
                break;
            case 'video':
                newElement = $('<video controls style="width: 200px; height: 150px;"><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">Your browser does not support the video tag.</video>');
                break;
        }
        newElement.find('.ui-resizable-handle').remove();
        newElement.appendTo('#editor');
        makeDraggableAndResizable(newElement);
        selectElement(newElement);
    });

    function selectElement(element) {
        $('.selected-element').removeClass('selected-element');
        element.addClass('selected-element');
        const color = element.css('color');
        const fontSize = parseInt(element.css('font-size'));
        const fontFamily = element.css('font-family');
        $('#text-color').val(rgbToHex(color));
        $('#text-size').val(fontSize);
        $('#text-font').val(fontFamily);
        const bgColor = element.css('background-color');
        $('#bg-color').val(rgbToHex(bgColor));
        element.find('.ui-resizable-handle').remove();

        const width = element.width();
        const height = element.height();
        $('#shape-color').val(rgbToHex(bgColor));
        $('#shape-width').val(width);
        $('#shape-height').val(height);
        element.find('.ui-resizable-handle').remove();
        $('#delete-element').show(); // Show the delete button when an element is selected

    }

    // Hide the delete button initially
    $('#delete-element').hide();

    // Delete the selected element when the delete button is clicked
    $('#delete-element').click(function() {
        $('.selected-element').remove();
        $('#delete-element').hide(); // Hide the delete button after deleting the element
    });

    function rgbToHex(rgb) {
        if (!rgb) return '#000000';
        const rgbArr = rgb.match(/\d+/g);
        const hex = (rgbArr[0] << 16) | (rgbArr[1] << 8) | rgbArr[2];
        return '#' + hex.toString(16).padStart(6, '0');
    }

    $('#shape-color').change(function() {
        const color = $(this).val();
        $('.selected-element').css('background-color', color);
    });

    $('#shape-width').change(function() {
        const width = $(this).val() + '%';
        $('.selected-element').css('width', width);
    });

    $('#shape-height').change(function() {
        const height = $(this).val() + '%';
        $('.selected-element').css('height', height);
    });

    $('#text-color').change(function() {
        const color = $(this).val();
        $('.selected-element').css('color', color);
    });

    $('#text-size').change(function() {
        const size = $(this).val() + 'px';
        $('.selected-element').css('font-size', size);
    });

    $('#text-font').change(function() {
        const font = $(this).val();
        $('.selected-element').css('font-family', font);
    });

    $('#bg-color').change(function() {
        const bgColor = $(this).val();
        $('.selected-element').css('background-color', bgColor);
    });

    $('#text-bold').click(function() {
        const element = $('.selected-element');
        const isBold = element.css('font-weight') === 'bold' || element.css('font-weight') === '700';
        element.css('font-weight', isBold ? 'normal' : 'bold');
    });

    $('#text-italic').click(function() {
        const element = $('.selected-element');
        const isItalic = element.css('font-style') === 'italic';
        element.css('font-style', isItalic ? 'normal' : 'italic');
    });

    $('#text-underline').click(function() {
        const element = $('.selected-element');
        const isUnderlined = element.css('text-decoration').includes('underline');
        element.css('text-decoration', isUnderlined ? 'none' : 'underline');
    });

    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }

    $('#editor').on('click', '[contenteditable="true"]', function() {
        selectElement($(this));
        placeCaretAtEnd(this);
    });

    $('.template-button').click(function() {
        const templateType = $(this).data('template');
        if (templateType === 'desktop') {
            $('#editor').css({ width: '1600px', height: '1080px' });
        } else if (templateType === 'mobile') {
            $('#editor').css({ width: '400px', height: '667px' });
        }
    });

    $('#add-image').click(function() {
        $('#image-input').click();
    });

    $('#image-input').change(function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const newImage = $(`<img src="${e.target.result}" style="max-width: 100%; height: auto;">`);
            newImage.appendTo('#editor');
            makeDraggableAndResizable(newImage);
            selectElement(newImage);
        };
        reader.readAsDataURL(file);
    });

    $('#editor-bg').change(function() {
        const color = $(this).val();
        $('#editor').css('background-color', color);
    });

    $('#export-html').click(function() {
        const editorContent = $('#editor').clone();
        editorContent.find('[contenteditable="true"]').removeAttr('contenteditable');
    
        // Replace <div> inside <p> with <br>
        editorContent.find('p').each(function() {
            $(this).html($(this).html().replace(/<div>/g, '<br>').replace(/<\/div>/g, ''));
        });
    
        const htmlContent = editorContent.html();
        const styles = $('#editor').attr('style');
        const fileNumber = getNextFileNumber();
    
        $.ajax({
            url: '/ApiAfficheurdynimac/save-html',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ htmlContent, styles, fileNumber }),
            success: function(response) {
                const url = window.location.origin + response.url;
                window.open(url, '_blank'); // Open the saved file in a new tab
            },
            error: function(xhr, status, error) {
                alert('Error saving file: ' + error);
            }
        });
    });
    
    
    // Function to get the next file number
    function getNextFileNumber() {
        const currentNumber = localStorage.getItem('fileNumber') || 1;
        localStorage.setItem('fileNumber', Number(currentNumber) + 1);
        return currentNumber;
    }
    
    $('#clear-editor').click(function() {
        $('#editor').empty();
    });
    function moveImage() {
                const uiWrapper = $('.ui-wrapper');
                const img = uiWrapper.find('img');
                if (img.length > 0) {
                    img.appendTo('#editor');
                    uiWrapper.remove(); // Optionally remove the empty ui-wrapper
                }
            }

            // Set up the MutationObserver
            const observer = new MutationObserver(function(mutationsList, observer) {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if ($(node).hasClass('ui-wrapper')) {
                                moveImage();
                            }
                        });
                    }
                }
            });

            // Observe the document body for added nodes
            observer.observe(document.body, { childList: true, subtree: true });
});
