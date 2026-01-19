# Configuration Google OAuth pour Argent de Poche

## Problème actuel
L'erreur "invalid_client" (401) indique que le Client ID dans le fichier `.env` n'est pas reconnu par Google.

## Solution : Configuration complète dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console
1. Ouvrez https://console.cloud.google.com
2. Connectez-vous avec votre compte Google (Cam14111@gmail.com)

### Étape 2 : Créer ou sélectionner un projet
1. Cliquez sur le menu déroulant du projet en haut
2. Créez un nouveau projet ou sélectionnez "argent-de-poche-484621" (s'il existe)
3. Donnez un nom : "Argent de Poche"

### Étape 3 : Activer l'API Google Drive
1. Allez dans **"APIs & Services" > "Library"**
2. Recherchez "Google Drive API"
3. Cliquez sur "ENABLE" (Activer)

### Étape 4 : Configurer l'écran de consentement OAuth
1. Allez dans **"APIs & Services" > "OAuth consent screen"**
2. Sélectionnez **"External"** (Externe)
3. Cliquez sur "CREATE"
4. Remplissez les informations :
   - **App name** : Argent de Poche
   - **User support email** : Cam14111@gmail.com
   - **Developer contact** : Cam14111@gmail.com
5. Cliquez sur "SAVE AND CONTINUE"
6. Dans "Scopes", cliquez sur "ADD OR REMOVE SCOPES"
7. Recherchez et sélectionnez : `https://www.googleapis.com/auth/drive.file`, `openid`, `email`
8. Cliquez sur "UPDATE" puis "SAVE AND CONTINUE"
9. Dans "Test users", ajoutez Cam14111@gmail.com
10. Cliquez sur "SAVE AND CONTINUE"

### Étape 5 : Créer les identifiants OAuth 2.0
1. Allez dans **"APIs & Services" > "Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Sélectionnez **"Application type" : "Web application"**
4. Donnez un nom : "Argent de Poche - Dev"
5. Dans **"Authorized JavaScript origins"**, ajoutez :
   - `http://localhost:5173`
   - `http://localhost:5174`
6. **NE PAS ajouter de "Authorized redirect URIs"** (pas nécessaire pour Google Identity Services)
7. Cliquez sur **"CREATE"**
8. Une popup s'affiche avec votre **Client ID**

### Étape 6 : Copier le nouveau Client ID
1. Copiez le **Client ID** (format : `xxxxx.apps.googleusercontent.com`)
2. Dans votre projet, ouvrez le fichier `.env`
3. Remplacez la valeur de `VITE_GOOGLE_CLIENT_ID` par le nouveau Client ID :
   ```
   VITE_GOOGLE_CLIENT_ID=VOTRE_NOUVEAU_CLIENT_ID.apps.googleusercontent.com
   ```
4. Sauvegardez le fichier

### Étape 7 : Redémarrer le serveur
Le serveur de développement va automatiquement redémarrer et prendre en compte le nouveau Client ID.

### Étape 8 : Tester l'authentification
1. Ouvrez http://localhost:5174/debug/google-auth
2. Vérifiez que tous les indicateurs sont verts
3. Cliquez sur "Tester l'authentification"
4. La popup Google devrait s'ouvrir et vous permettre de vous authentifier

## Important
- Le Client ID actuel dans votre `.env` (`253605611976-vcmh3b353399iuuq2f8dveceokci2nhi.apps.googleusercontent.com`) n'est pas valide
- Vous DEVEZ créer un nouveau Client ID ou vérifier que celui-ci existe bien dans votre Google Cloud Console
- Les "Origines JavaScript autorisées" DOIVENT inclure `http://localhost:5173` et `http://localhost:5174`

## Vérification rapide
Si vous avez déjà un projet avec des identifiants :
1. Allez dans https://console.cloud.google.com/apis/credentials
2. Vérifiez que le Client ID dans `.env` correspond à un client existant
3. Vérifiez que les origines JavaScript incluent `http://localhost:5173` et `http://localhost:5174`
4. Si le client n'existe pas, créez-en un nouveau en suivant l'Étape 5 ci-dessus
