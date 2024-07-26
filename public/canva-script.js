import { batimentData, getWeatherData } from './main.js';
var batiment_Data = null;
var getWeather_Data = null;
var undoStack = [];
var redoStack = [];

$(document).ready(async function() {
    batiment_Data = await batimentData("24e124725c378643");
    getWeather_Data = await getWeatherData();

    function saveState() {
        const currentState = $('#editor').html();
        undoStack.push(currentState);
        redoStack = []; // Clear the redo stack whenever a new action is performed
    }

    function undo() {
        if (undoStack.length > 0) {
            const currentState = $('#editor').html();
            redoStack.push(currentState);

            const previousState = undoStack.pop();
            $('#editor').html(previousState);
            rebindEvents(); // Rebind events after restoring state
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const currentState = $('#editor').html();
            undoStack.push(currentState);

            const nextState = redoStack.pop();
            $('#editor').html(nextState);
            rebindEvents(); // Rebind events after restoring state
        }
    }

    function rebindEvents() {
        $('#editor').find('*').off(); // Unbind all previous events
        makeDraggableAndResizable($('#editor').find('*')); // Rebind draggable and resizable
        $('#editor').on('click', '[contenteditable="true"]', function() {
            selectElement($(this));
        });
    }

    function makeDraggableAndResizable(element) {
        element.draggable({
            containment: "#editor",
            drag: function(event, ui) {
                showGuides(ui.helper);
                snapToGuides(ui.helper, ui.position);
            },
            stop: function(event, ui) {
                hideGuides();
                const parentWidth = $('#editor').width();
                const parentHeight = $('#editor').height();
                const leftPercent = (ui.position.left / parentWidth) * 100;
                const topPercent = (ui.position.top / parentHeight) * 100;
                $(this).css({
                    'left': leftPercent + '%',
                    'top': topPercent + '%',
                    'position': 'absolute'
                });
                saveState();
            }
        }).css('position', 'absolute');

        if (element.is('h1, h2, h3, h4, h5, p')) {
            element.on("focus", function() {
                $(this).draggable("disable").resizable("disable");
            }).on("blur", function() {
                $(this).draggable("enable").resizable("enable");
            });
        }

        if (element.is('img') || element.hasClass('icon-preview')) {
            interact(element[0])
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    listeners: {
                        move(event) {
                            let { x, y } = event.target.dataset;
                            x = (parseFloat(x) || 0) + event.deltaRect.left;
                            y = (parseFloat(y) || 0) + event.deltaRect.top;

                            Object.assign(event.target.style, {
                                width: `${event.rect.width}px`,
                                height: `${event.rect.height}px`,
                                transform: `translate(${x}px, ${y}px)`
                            });

                            Object.assign(event.target.dataset, { x, y });
                        },
                        end(event) {
                            const target = event.target;
                            const parent = document.getElementById('editor');
                            const parentWidth = parent.clientWidth;
                            const parentHeight = parent.clientHeight;
                            const widthPercent = (event.rect.width / parentWidth) * 100;
                            const heightPercent = (event.rect.height / parentHeight) * 100;

                            target.style.width = widthPercent + '%';
                            target.style.height = heightPercent + '%';
                            target.style.transform = '';
                            target.setAttribute('data-x', 0);
                            target.setAttribute('data-y', 0);

                            saveState();
                        }
                    }
                });
        } else {
            element.resizable({
                containment: "#editor",
                stop: function(event, ui) {
                    const parentWidth = $('#editor').width();
                    const parentHeight = $('#editor').height();
                    const widthPercent = (ui.size.width / parentWidth) * 100;
                    const heightPercent = (ui.size.height / parentHeight) * 100;
                    $(this).css({
                        'width': widthPercent + '%',
                        'height': heightPercent + '%'
                    });
                    saveState();
                }
            });
        }
    }

    function showGuides(element) {
        const elementOffset = element.offset();
        const editorOffset = $('#editor').offset();
        const editorWidth = $('#editor').width();
        const editorHeight = $('#editor').height();
        const elementWidth = element.width();
        const elementHeight = element.height();
        const centerX = editorWidth / 2;
        const centerY = editorHeight / 2;

        const xAxisGuide = $('#x-axis-guide');
        const yAxisGuide = $('#y-axis-guide');

        if (Math.abs((elementOffset.left + elementWidth / 2) - (editorOffset.left + centerX)) < 10) {
            xAxisGuide.show().css('top', centerY + editorOffset.top + 'px');
        } else {
            xAxisGuide.hide();
        }

        if (Math.abs((elementOffset.top + elementHeight / 2) - (editorOffset.top + centerY)) < 10) {
            yAxisGuide.show().css('left', centerX + editorOffset.left + 'px');
        } else {
            yAxisGuide.hide();
        }
    }

    function snapToGuides(element, position) {
        const editorOffset = $('#editor').offset();
        const editorWidth = $('#editor').width();
        const editorHeight = $('#editor').height();
        const elementWidth = element.width();
        const elementHeight = element.height();
        const centerX = editorWidth / 2;
        const centerY = editorHeight / 2;

        if (Math.abs((position.left + elementWidth / 2) - centerX) < 10) {
            position.left = centerX - elementWidth / 2;
        }

        if (Math.abs((position.top + elementHeight / 2) - centerY) < 10) {
            position.top = centerY - elementHeight / 2;
        }
    }

    function hideGuides() {
        $('#x-axis-guide').hide();
        $('#y-axis-guide').hide();
    }

    $('.element-button').click(function() {
        saveState();
        const elementType = $(this).data('element');
        let newElement;
        switch (elementType) {
            case 'BatimentCo2':
                newElement = $(`<h3 contenteditable="true" class="batiment-co2">${batiment_Data.co2} ppm</h3>`);
                break;
            case 'BatimentBattery':
                newElement = $(`<h3 contenteditable="true" class="batiment-battery">${batiment_Data.battery} %</h3>`);
                break;
            case 'BatimentHum':
                newElement = $(`<h3 contenteditable="true" class="batiment-humidity">${batiment_Data.humidity} %</h3>`);
                break;
            case 'BatimentTemp':
                newElement = $(`<h3 contenteditable="true" class="batiment-temperature">${batiment_Data.temperature} °C</h3>`);
                break;
            case 'MeteoTemp':
                newElement = $(`<h3 contenteditable="true" class="Weather-temperature">${getWeather_Data.temperature} °C</h3>`);
                break;
            case 'MeteoTempMax':
                newElement = $(`<h3 contenteditable="true" class="Weather-tempMax">${getWeather_Data.tempMax} °C</h3>`);
                break;
            case 'MeteoTempMin':
                newElement = $(`<h3 contenteditable="true" class="Weather-tempMin">${getWeather_Data.tempMin} °C</h3>`);
                break;
            case 'MeteoHum':
                newElement = $(`<h3 contenteditable="true" class="Weather-humidity">${getWeather_Data.humidity} %</h3>`);
                break;
            case 'h1':
                newElement = $('<h1 contenteditable="true">Titre h1</h1>');
                break;
            case 'h2':
                newElement = $('<h2 contenteditable="true">Titre h2</h2>');
                break;
            case 'h3':
                newElement = $('<h3 contenteditable="true">Titre h3</h3>');
                break;
            case 'h4':
                newElement = $('<h4 contenteditable="true">Titre h4</h4>');
                break;
            case 'h5':
                newElement = $('<h5 contenteditable="true">Titre h5</h5>');
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

        const width = element.width();
        const height = element.height();
        $('#shape-color').val(rgbToHex(bgColor));
        $('#shape-width').val(width);
        $('#shape-height').val(height);

        $('#delete-element').show(); // Show the delete button when an element is selected
    }

    // Hide the delete button initially
    $('#delete-element').hide();

    // Delete the selected element when the delete button is clicked
    $('#delete-element').click(function() {
        saveState();
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
        saveState();
        const color = $(this).val();
        $('.selected-element').css('background-color', color);
    });

    $('#shape-width').change(function() {
        saveState();
        const width = $(this).val() + 'px';
        $('.selected-element').css('width', width);
    });

    $('#shape-height').change(function() {
        saveState();
        const height = $(this).val() + 'px';
        $('.selected-element').css('height', height);
    });

    $('#text-color').change(function() {
        saveState();
        const color = $(this).val();
        $('.selected-element').css('color', color);
    });

    $('#text-size').change(function() {
        saveState();
        const size = $(this).val() + 'px';
        $('.selected-element').css('font-size', size);
    });

    $('#text-font').change(function() {
        saveState();
        const font = $(this).val();
        $('.selected-element').css('font-family', font);
    });

    $('#bg-color').change(function() {
        saveState();
        const bgColor = $(this).val();
        $('.selected-element').css('background-color', bgColor);
    });

    $('#text-bold').click(function() {
        saveState();
        const element = $('.selected-element');
        const isBold = element.css('font-weight') === 'bold' || element.css('font-weight') === '700';
        element.css('font-weight', isBold ? 'normal' : 'bold');
    });

    $('#text-italic').click(function() {
        saveState();
        const element = $('.selected-element');
        const isItalic = element.css('font-style') === 'italic';
        element.css('font-style', isItalic ? 'normal' : 'italic');
    });

    $('#text-underline').click(function() {
        saveState();
        const element = $('.selected-element');
        const isUnderlined = element.css('text-decoration').includes('underline');
        element.css('text-decoration', isUnderlined ? 'none' : 'underline');
    });

    $('#editor').on('click', '[contenteditable="true"]', function() {
        selectElement($(this));
    });

    $('#undo-button').click(function() {
        undo();
    });

    $('#redo-button').click(function() {
        redo();
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
        saveState();
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
        saveState();
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
                const url = window.location.origin + "/afficheurdynamique" + response.url;
                window.open(url, '_blank'); // Open the saved file in a new tab
            },
            error: function(xhr, status, error) {
                alert('Error saving file: ' + error);
            }
        });
    });

    function getNextFileNumber() {
        const currentNumber = localStorage.getItem('fileNumber') || 1;
        localStorage.setItem('fileNumber', Number(currentNumber) + 1);
        return currentNumber;
    }

    $('#clear-editor').click(function() {
        saveState();
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

    const observer = new MutationObserver(function(mutationsList) {
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

    observer.observe(document.body, { childList: true, subtree: true });

    var baseUrl = '/ApiAfficheurdynimac/icons';

    function fetchIcons(query) {
        $.ajax({
            url: baseUrl,
            method: 'GET',
            data: {
                q: query,
                limit: 100,
                offset: 0
            },
            success: function(response) {
                var icons = response.icons;
                var output = '';

                $.each(icons, function(index, icon) {
                    var size300 = icon.raster_sizes.find(function(size) {
                        return size.size >= 300; // Find a size that's 300px or larger
                    });

                    if (size300 && size300.formats.length > 0) {
                        output += '<img src="' + size300.formats[0].preview_url + '" alt="' + icon.tags.join(', ') + '" width="128" class="icon-preview">';
                    }
                });

                $('#icon-results').html(output);

                $('.icon-preview').on('click', function() {
                    saveState();
                    const newImage = $('<img>', {
                        src: $(this).attr('src'),
                        style: 'width: 300px; height: 300px;',
                        class: 'shapes-icone'
                    });
                    newImage.appendTo('#editor');
                    makeDraggableAndResizable(newImage);
                    selectElement(newImage);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error: ' + status + ' - ' + error);
            }
        });
    }

    fetchIcons('');

    $('#search-icons').on('click', function() {
        var query = $('#icon-search').val().trim();
        fetchIcons(query);
    });

    $('#icon-search').on('keypress', function(event) {
        if (event.which === 13) { // Enter key
            $('#search-icons').click();
        }
    });

    // Replace with your Pexels API key
    const PEXELS_API_KEY = 'aWQ3BdmIeD4ROJ8sV9ta6NV8CyeEWCiY14YNlhx5IGZCwpZV2iVuSwQ8';
    const baseUrlz = 'https://api.pexels.com/v1/search';

    function fetchImages(query) {
        $.ajax({
            url: baseUrlz,
            method: 'GET',
            data: {
                query: query,
                per_page: 20,
                page: 1
            },
            headers: {
                'Authorization': PEXELS_API_KEY
            },
            success: function(response) {
                var images = response.photos;
                var output = '';

                $.each(images, function(index, image) {
                    output += '<img src="' + image.src.large2x + '" alt="' + (image.alt ? image.alt : 'Image') + '" width="128" class="image-preview">';
                });

                $('#image-results').html(output);

                $('.image-preview').on('click', function() {
                    saveState();
                    const newImage = $('<img>', {
                        src: $(this).attr('src'),
                        class: 'img-cover',
                        style: 'width: 300px; height: 300px;'
                    });
                    newImage.appendTo('#editor');
                    makeDraggableAndResizable(newImage);
                    selectElement(newImage);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error: ' + status + ' - ' + error);
            }
        });
    }

    fetchImages('nature');

    $('#search-images').on('click', function() {
        var query = $('#image-search').val().trim();
        fetchImages(query);
    });

    $('#image-search').on('keypress', function(event) {
        if (event.which === 13) { // Enter key
            $('#search-images').click();
        }
    });
});