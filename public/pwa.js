document.addEventListener('DOMContentLoaded', init, false);
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then((reg) => {
        // console.log('Service worker registered -->', reg);
      }, (err) => {
        console.error('Service worker not registered -->', err);
      });
  }
  window.addEventListener('resize', function(){
    let fixedWidth = 200;
    let fixedHeight = 540;

    window.resizeTo(fixedWidth, fixedHeight);
});

if (navigator.presentation && typeof navigator.presentation.request === 'function') {
  if (navigator.presentation) {
    const presentationRequest = new PresentationRequest(['text/html']);
    presentationRequest.acceptAllOrigins = true;
    presentationRequest.use = "window";
  
    navigator.presentation.request(presentationRequest).then((connection) => {
      // Handle the presentation connection
      connection.onclose = () => {
        // Handle the close event
      };
    }).catch((error) => {
      // Handle errors
    });
  }} 
}