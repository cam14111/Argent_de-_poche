# Checklist Google OAuth - Diagnostics

## ✅ Déjà fait
- [x] Client ID existe et est correct
- [x] Origines JavaScript autorisées : http://localhost:5173 et http://localhost:5174

## À vérifier maintenant

### 1. API Google Drive activée
1. Allez sur https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Vérifiez que le statut est **"API activée"**
3. Si ce n'est pas le cas, cliquez sur **"ACTIVER"**

### 2. Écran de consentement OAuth configuré
1. Allez sur https://console.cloud.google.com/apis/credentials/consent
2. Vérifiez que l'écran de consentement est configuré
3. Dans **"Scopes"**, vérifiez que vous avez : `https://www.googleapis.com/auth/drive.file`, `openid`, `email`

### 3. Test Users (si l'app est en mode Testing)
1. Dans l'écran de consentement OAuth
2. Si le statut est **"Testing"**, allez dans **"Test users"**
3. Ajoutez votre email : **Cam14111@gmail.com**

## Test de l'authentification

Une fois ces vérifications faites :
1. Ouvrez http://localhost:5173/debug/google-auth
2. Cliquez sur "Tester l'authentification"
3. Si la popup s'ouvre et fonctionne, l'authentification est OK !

## Erreurs courantes

- **"This app isn't verified"** : Normal en mode Testing, cliquez sur "Advanced" puis "Go to [app name]"
- **"Access blocked"** : Vérifiez les scopes dans l'écran de consentement (drive.file, openid, email)
- **Popup ne s'ouvre pas** : Vérifiez que les popups ne sont pas bloquées dans Chrome
