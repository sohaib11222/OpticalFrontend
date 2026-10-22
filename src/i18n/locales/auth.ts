import type { LocaleModule } from "../types";

const en: Record<string, string> = {
  "auth.login.title": "Welcome back",
  "auth.register.title": "Create your shop account",
  "auth.forgot.title": "Forgot password?",
  "auth.reset.title": "Reset your password",

  "auth.register.subtitle": "Manage your optical shop with a private account.",
  "auth.subtitle": "Secure access to your optical shop.",

  "auth.field.name": "Your name",
  "auth.field.shopName": "Shop name",
  "auth.field.email": "Email",
  "auth.field.password": "Password",
  "auth.field.passwordConfirm": "Confirm password",
  "auth.field.businessPhone": "Business phone",
  "auth.field.addressLine1": "Street address",
  "auth.field.addressLine2": "Address line 2 (optional)",
  "auth.field.city": "City",
  "auth.field.postalCode": "Postal code / CAP",
  "auth.field.country": "Country",
  "auth.field.shopTimezone": "Shop time zone",

  "auth.error.passwordRequired": "Password is required.",
  "auth.error.passwordWeak":
    "Use at least 12 characters, including letters and numbers.",
  "auth.error.passwordMinLength": "Use at least 12 characters.",
  "auth.error.passwordNeedsLetter": "Include a letter.",
  "auth.error.passwordNeedsNumber": "Include a number.",
  "auth.error.passwordTooLong": "Use at most 72 UTF-8 bytes.",
  "auth.error.passwordMismatch": "Passwords do not match.",
  "auth.error.phoneFormat": "Enter a valid business phone number.",
  "auth.error.phoneDigits": "Use 7 to 15 digits.",

  "auth.submit.login": "Sign in",
  "auth.submit.register": "Create account",
  "auth.submit.forgot": "Send reset link",
  "auth.submit.reset": "Reset password",

  "auth.link.login": "Sign in",
  "auth.link.register": "Register",
  "auth.link.forgot": "Forgot password?",

  "auth.register.step1": "Owner account",
  "auth.register.step2": "Your business",
  "auth.register.step3": "Review",

  "auth.register.heading1": "Create your owner account",
  "auth.register.heading2": "Tell us about your optical shop",
  "auth.register.heading3": "Review your registration",

  "auth.register.progress": "Step {step} of {total}",
  "auth.register.desc1": "Your secure sign-in details.",
  "auth.register.desc2": "Business contact details for your shop workspace.",
  "auth.register.desc3": "Check your details before creating your account.",

  "auth.register.passwordHint":
    "At least 12 characters, including letters and numbers.",
  "auth.register.showPassword": "Show",
  "auth.register.hidePassword": "Hide",

  "auth.register.timezoneHint":
    "Use an IANA time zone, such as Europe/Rome. Appointments will use this setting.",
  "auth.register.editOwner": "Edit owner details",
  "auth.register.editBusiness": "Edit business details",
  "auth.register.verificationNotice":
    "We will email you a verification link. Verify your email to continue; shop access may also require administrator approval.",
  "auth.register.creating": "Creating account…",
  "auth.register.alreadyRegistered": "Already registered?",
  "auth.register.connectionFailed":
    "Connection failed. Your details are still here; please retry.",

  "auth.verify.title": "Verify your email",
  "auth.verify.initial": "Confirm your email address to continue.",
  "auth.verify.invalidLink": "Invalid verification link. Request a new email.",
  "auth.verify.success": "Email verified. You can continue to your account.",
  "auth.verify.failed": "Unable to verify email.",
  "auth.verify.action": "Verify email",
  "auth.verify.continue": "Continue to account",
};

const it: Record<string, string> = {
  "auth.login.title": "Bentornato",
  "auth.register.title": "Crea l’account del tuo negozio",
  "auth.forgot.title": "Password dimenticata?",
  "auth.reset.title": "Reimposta la password",

  "auth.register.subtitle":
    "Gestisci il tuo negozio ottico con un account privato.",
  "auth.subtitle": "Accesso sicuro al tuo negozio ottico.",

  "auth.field.name": "Il tuo nome",
  "auth.field.shopName": "Nome del negozio",
  "auth.field.email": "Email",
  "auth.field.password": "Password",
  "auth.field.passwordConfirm": "Conferma password",
  "auth.field.businessPhone": "Telefono del negozio",
  "auth.field.addressLine1": "Indirizzo",
  "auth.field.addressLine2": "Indirizzo - riga 2 (facoltativo)",
  "auth.field.city": "Città",
  "auth.field.postalCode": "CAP",
  "auth.field.country": "Nazione",
  "auth.field.shopTimezone": "Fuso orario del negozio",

  "auth.error.passwordRequired": "La password è obbligatoria.",
  "auth.error.passwordWeak":
    "Usa almeno 12 caratteri, tra cui lettere e numeri.",
  "auth.error.passwordMinLength": "Usa almeno 12 caratteri.",
  "auth.error.passwordNeedsLetter": "Inserisci almeno una lettera.",
  "auth.error.passwordNeedsNumber": "Inserisci almeno un numero.",
  "auth.error.passwordTooLong": "Usa al massimo 72 byte UTF-8.",
  "auth.error.passwordMismatch": "Le password non corrispondono.",
  "auth.error.phoneFormat": "Inserisci un numero di telefono valido.",
  "auth.error.phoneDigits": "Usa da 7 a 15 cifre.",

  "auth.submit.login": "Accedi",
  "auth.submit.register": "Crea account",
  "auth.submit.forgot": "Invia link di reimpostazione",
  "auth.submit.reset": "Reimposta la password",

  "auth.link.login": "Accedi",
  "auth.link.register": "Registrati",
  "auth.link.forgot": "Password dimenticata?",

  "auth.register.step1": "Account del titolare",
  "auth.register.step2": "La tua attività",
  "auth.register.step3": "Riepilogo",

  "auth.register.heading1": "Crea il tuo account titolare",
  "auth.register.heading2": "Parlaci del tuo negozio ottico",
  "auth.register.heading3": "Verifica la registrazione",

  "auth.register.progress": "Passo {step} di {total}",
  "auth.register.desc1": "Le tue credenziali di accesso.",
  "auth.register.desc2":
    "Recapiti del negozio per il tuo spazio di lavoro.",
  "auth.register.desc3": "Controlla i dati prima di creare il tuo account.",

  "auth.register.passwordHint":
    "Almeno 12 caratteri, tra cui lettere e numeri.",
  "auth.register.showPassword": "Mostra",
  "auth.register.hidePassword": "Nascondi",

  "auth.register.timezoneHint":
    "Usa un fuso orario IANA, ad esempio Europe/Rome. Gli appuntamenti useranno questa impostazione.",
  "auth.register.editOwner": "Modifica i dati del titolare",
  "auth.register.editBusiness": "Modifica i dati del negozio",
  "auth.register.verificationNotice":
    "Ti invieremo via email un link di verifica. Verifica il tuo indirizzo email per continuare; l’accesso al negozio potrebbe richiedere anche l’approvazione di un amministratore.",
  "auth.register.creating": "Creazione dell’account…",
  "auth.register.alreadyRegistered": "Hai già un account?",
  "auth.register.connectionFailed":
    "Connessione non riuscita. I tuoi dati sono ancora qui; riprova.",

  "auth.verify.title": "Verifica la tua email",
  "auth.verify.initial": "Conferma il tuo indirizzo email per continuare.",
  "auth.verify.invalidLink": "Link di verifica non valido. Richiedi una nuova email.",
  "auth.verify.success": "Email verificata. Puoi continuare al tuo account.",
  "auth.verify.failed": "Impossibile verificare l’email.",
  "auth.verify.action": "Verifica l’email",
  "auth.verify.continue": "Continua all’account",
};

export default { en, it } satisfies LocaleModule;