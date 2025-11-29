# Firebase - Passo a Passo Simples

## 1. Criar Conta e Projeto

1. Abra: https://firebase.google.com
2. Clique em "Começar" ou "Ir para console"
3. Clique em "+ Criar projeto"
4. Preencha:
   - Nome do projeto: **VetCheck** (ou outro nome)
   - Deixe as opções padrão
   - Clique "Continuar"
5. Na próxima tela, deixe tudo como está e clique "Criar projeto"
6. Espere alguns segundos até ficar pronto

## 2. Copiar Credenciais do Firebase

1. No console do Firebase, você estará no seu projeto
2. No menu esquerdo, clique em **⚙️ Configurações do Projeto** (engrenagem)
3. Clique na aba **"Seu aplicativo"**
4. Clique em **"Webapp"** (ícone de </> )
5. Copie o bloco de código que aparecer. Ele vai ser assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

6. Guarde esse código (vamos usar em breve)

## 3. Ativar Firestore Database

1. No menu esquerdo, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Na tela de segurança:
   - Selecione **"Iniciar no modo teste"**
   - Clique "Próximo"
4. Escolha a localização (deixe a padrão)
5. Clique "Habilitar"
6. Espere alguns segundos

## 4. Ativar Autenticação

1. No menu esquerdo, clique em **"Authentication"**
2. Clique em **"Começar"** ou **"Ir para o console"**
3. Clique na aba **"Provedores de sinais"**
4. Clique em **"Email/Senha"**
5. Ative a opção **"Email/Senha"** (toggle)
6. Clique "Salvar"

## 5. Colar as Credenciais no Seu Projeto

1. Abra o arquivo: `www/js/clouddb.js`
2. Procure pela linha com `const firebaseConfig = {`
3. Substitua o objeto inteiro pela configuração que você copiou do Firebase
4. Salve o arquivo

Exemplo de como ficará:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_sua_chave_aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 6. Configurar Regras de Segurança

1. No Firestore (menu esquerdo → Firestore Database)
2. Clique na aba **"Regras"**
3. **Delete tudo** que está lá
4. Cole isto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      match /pets/{petId} {
        allow read, write: if request.auth.uid == uid;
      }
      
      match /appointments/{apptId} {
        allow read, write: if request.auth.uid == uid;
      }
      
      match /anamnesis/{anamId} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```

5. Clique "Publicar"

## Pronto! ✅

Seu Firebase está configurado e pronto para usar. Agora:

- A app vai guardar dados NA NUVEM automaticamente
- Cada usuário só vê seus próprios dados
- Os dados são seguros (protegidos pelas regras)

## Testando

1. Recarregue a página da app (`agendamento.html`)
2. Crie um login novo
3. Crie um agendamento com anamnese
4. Volte ao Firebase Console → Firestore Database
5. Você deve ver uma coleção `users` com seus dados lá!

## Possíveis Erros

**"Firebase SDK not loaded"**
- Seu Firebase não foi inicializado. Verifique se colou a config correta em `clouddb.js`

**"Cloud DB not initialized"**
- Espere alguns segundos após carregar a página, o Firebase demora um pouco para conectar

**Dados não aparecem no Firestore**
- Verifique as regras de segurança
- Veja o console do navegador (F12 → Console) para erros

## Onde Ver os Dados

1. Firebase Console
2. Clique em "Firestore Database"
3. Você verá as coleções:
   - `users/` → seus usuários
   - `users/{uid}/pets/` → pets de cada usuário
   - `users/{uid}/appointments/` → agendamentos
   - `users/{uid}/anamnesis/` → anamneses
