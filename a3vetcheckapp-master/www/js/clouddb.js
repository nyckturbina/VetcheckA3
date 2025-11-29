/* Cloud Database wrapper using Firebase Firestore
   Initializes Firebase and provides cloud sync methods.
   Data is synced to Firestore and kept in local IndexedDB as cache.
*/
(function(){
  const CloudDB = {};
  let firebaseApp = null;
  let auth = null;
  let firestore = null;

  // Firebase config (create a free project at https://firebase.google.com)
  // IMPORTANTE: Substituir com a config real do seu projeto Firebase
  // Copie do Firebase Console > Configurações do Projeto > Seu aplicativo (</> webapp)
  const firebaseConfig = {
    apiKey: "AIzaSyDuOguBZ4keEzghrvX0IRviEzwBzq2tl-g",
    authDomain: "vetcheck-9081b.firebaseapp.com",
    projectId: "vetcheck-9081b",
    storageBucket: "vetcheck-9081b.appspot.com",
    messagingSenderId: "574766296360",
    appId: "1:574766296360:web:aca69ba9a625be5e79b41d",
    measurementId: "G-0DHMY14MK9"
  };
  // If you have your Firebase config, paste it here (replace the example values):
  // const firebaseConfig = {
  //   apiKey: "AIzaSy...",
  //   authDomain: "your-project.firebaseapp.com",
  //   projectId: "your-project-id",
  //   storageBucket: "your-project-id.appspot.com",
  //   messagingSenderId: "1234567890",
  //   appId: "1:1234567890:web:abcdef...",
  //   measurementId: "G-XXXXXXX" // optional
  // };
  // Initialize Firebase (called when clouddb.js loads)
  CloudDB.init = async function(){
    try{
      if(!window.firebase){
        console.warn('Firebase SDK not loaded. Cloud sync disabled. Using local DB only.');
        return false;
      }
      firebaseApp = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      firestore = firebase.firestore();
      console.info('Firebase initialized for cloud sync');
      return true;
    }catch(e){
      console.warn('Firebase init failed', e.message, '— using local DB only');
      return false;
    }
  };

  // Check if cloud is active
  CloudDB.isActive = function(){
    return firestore !== null;
  };

  // Get current Firebase user
  CloudDB.getCurrentUser = function(){
    return auth ? auth.currentUser : null;
  };

  // Sign up with email/password (stores in Firebase Auth)
  CloudDB.signUp = async function(email, password, name, phone, address, cpf){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = userCred.user.uid;
    // also store user document in Firestore for reference
    await firestore.collection('users').doc(uid).set({
      uid: uid,
      email: email,
      name: name || '',
      phone: phone || '',
      address: address || '',
      cpf: cpf || '',
      created_at: new Date().toISOString()
    });
    return { id: uid, email, name, phone, address, cpf };
  };

  // Sign in (Firebase Auth)
  CloudDB.signIn = async function(email, password){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const uid = userCred.user.uid;
    // fetch user doc from Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();
    const data = userDoc.data() || {};
    return { id: uid, ...data };
  };

  // Update user profile
  CloudDB.updateUser = async function(uid, name, phone, address, cpf, newEmail){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const updates = { name: name || '', phone: phone || '', address: address || '', cpf: cpf || '' };
    if(newEmail && newEmail !== auth.currentUser.email){
      await auth.currentUser.updateEmail(newEmail);
      updates.email = newEmail;
    }
    await firestore.collection('users').doc(uid).update(updates);
  };

  // Add or update pet
  CloudDB.setPet = async function(petData, petId){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const uid = auth.currentUser.uid;
    if(petId){
      await firestore.collection('users').doc(uid).collection('pets').doc(String(petId)).update(petData);
      return { id: petId };
    } else {
      const ref = await firestore.collection('users').doc(uid).collection('pets').add({...petData, created_at: new Date().toISOString()});
      return { id: ref.id };
    }
  };

  // Get all pets for user
  CloudDB.getUserPets = async function(uid){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const snap = await firestore.collection('users').doc(uid).collection('pets').get();
    return snap.docs.map(d => ({id: d.id, ...d.data()}));
  };

  // Add or update appointment
  CloudDB.setAppointment = async function(apptData, apptId){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const uid = auth.currentUser.uid;
    if(apptId){
      await firestore.collection('users').doc(uid).collection('appointments').doc(String(apptId)).update(apptData);
      return { id: apptId };
    } else {
      const ref = await firestore.collection('users').doc(uid).collection('appointments').add({...apptData, created_at: new Date().toISOString()});
      return { id: ref.id };
    }
  };

  // Get all appointments for user
  CloudDB.getUserAppointments = async function(uid){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const snap = await firestore.collection('users').doc(uid).collection('appointments').get();
    return snap.docs.map(d => ({id: d.id, ...d.data()}));
  };

  // Add or update anamnesis
  CloudDB.setAnamnesis = async function(anamData, anamId){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const uid = auth.currentUser.uid;
    if(anamId){
      await firestore.collection('users').doc(uid).collection('anamnesis').doc(String(anamId)).update(anamData);
      return { id: anamId };
    } else {
      const ref = await firestore.collection('users').doc(uid).collection('anamnesis').add({...anamData, created_at: new Date().toISOString()});
      return { id: ref.id };
    }
  };

  // Get anamnesis by appointment
  CloudDB.getAnamnesisForAppointment = async function(appointmentId){
    if(!firestore) throw new Error('Cloud DB not initialized');
    const uid = auth.currentUser.uid;
    const snap = await firestore.collection('users').doc(uid).collection('anamnesis')
      .where('appointment_id', '==', appointmentId).limit(1).get();
    return snap.docs.length ? snap.docs[0].data() : null;
  };

  // Sign out
  CloudDB.signOut = async function(){
    if(auth) await auth.signOut();
  };

  // Initialize on load
  window.addEventListener('load', function(){
    if(typeof CloudDB.init === 'function'){
      CloudDB.init().catch(e => console.warn('CloudDB init error on load', e));
    }
  });

  window.CloudDB = CloudDB;
})();
