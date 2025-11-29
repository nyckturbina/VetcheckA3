// Initialize Framework7 and main view so other modules can navigate
document.addEventListener('DOMContentLoaded', function(){
  try{
    if (window.Framework7 && !window.f7App){
      const app = new Framework7({
        root: '#app',
        id: 'com.vet.vetagenda',
        name: 'VetAgenda',
        routes: [
          { path: '/appointments/', pageName: 'appointments' }
        ]
      });
      const mainView = app.views.create('.view-main');
      window.f7App = app;
      window.mainView = mainView;
    }
  }catch(e){
    console.warn('Framework7 init failed', e);
  }
});
