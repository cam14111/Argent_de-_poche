# Argent_de-_poche

## PWA en dev : eviter le cache fantome

Pourquoi le bug arrive :
- Le service worker met en cache l'application pour le mode offline.
- Sur localhost, meme apres l'arret de Vite, le service worker peut repondre avec la version cachee.
- Resultat : le navigateur affiche encore l'app alors que le serveur est bien arrete.

Comment verifier "serveur reel vs cache" (Windows) :
- `Test-NetConnection -ComputerName localhost -Port 5173`
- Si `TcpTestSucceeded` est `False` et que l'app s'affiche quand meme, c'est le cache du service worker.

Comment reinitialiser les SW/caches :
- Ouvrir `http://localhost:5173/__dev/sw-reset` (ou 5174/5176 selon le port).
- Ou lancer `npm run dev:reset-sw` pour ouvrir automatiquement la page de reset.
- En mode dev, l'app tente aussi de desinscrire les SW et vider les caches au chargement.

En mode production :
- Le comportement PWA reste inchange (service worker actif, cache et offline OK).
