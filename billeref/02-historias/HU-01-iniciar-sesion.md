# HU-01 · Iniciar sesión con celular y PIN

- **Épica:** Acceso · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.1 · ADR-003, ADR-007

## Historia

**Como** usuario de la billetera,
**quiero** ingresar con mi número de celular y mi PIN de 4 dígitos,
**para** acceder a mi saldo y operar de forma segura.

## Reglas de negocio

- El celular tiene 8 dígitos numéricos (SH-01); el PIN, exactamente 4 dígitos.
- El PIN nunca se muestra en pantalla, no se guarda en texto plano y nunca aparece en logs.
- Un celular inexistente responde igual que un PIN incorrecto: no se revela qué celulares existen.
- Un login exitoso reinicia el contador de intentos fallidos (HU-02).

## Criterios de aceptación

```gherkin
Característica: Iniciar sesión

  Escenario: CA-01.1 · Ingreso exitoso
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000001" y el PIN "1111"
    Entonces veo la pantalla de inicio con el nombre "Ana Ficticia Rojas"

  Escenario: CA-01.2 · PIN incorrecto
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000001" y el PIN "9999"
    Entonces veo el mensaje "Celular o PIN incorrectos"
    Y sigo en la pantalla de ingreso

  Escenario: CA-01.3 · Celular inexistente responde igual que un PIN incorrecto
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "79999999" y el PIN "1111"
    Entonces veo el mensaje "Celular o PIN incorrectos"

  Escenario: CA-01.4 · Celular con formato inválido
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "7000" y el PIN "1111"
    Entonces veo el mensaje "Ingresa un celular válido de 8 dígitos"
    Y no se envía la solicitud al servidor

  Escenario: CA-01.5 · El PIN no se muestra
    Dado que estoy en la pantalla de ingreso
    Cuando escribo el PIN "1111"
    Entonces el campo muestra caracteres ocultos
    Y el campo acepta solo 4 dígitos numéricos

  Escenario: CA-01.6 · El PIN no aparece en los logs
    Dado que inicié sesión con el celular "70000001" y el PIN "1111"
    Cuando reviso los logs del backend
    Entonces no aparece el texto "1111" como PIN
    Y no aparece el celular "70000001" completo

  Escenario: CA-01.7 · PIN con formato inválido
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000001" y el PIN "11"
    Entonces el botón "Ingresar" está deshabilitado
    Y si la API recibe el PIN "11" responde el código "PIN_INVALIDO" sin contarlo como intento fallido
```

## Notas técnicas

- `POST /api/auth/login` con cuerpo `{celular, pin}`; responde el JWT (5 min) y los datos básicos del usuario.
- PIN verificado con `PasswordHasher<T>` (PBKDF2) contra el hash de `usuarios.json`.
- Campo PIN: `type="password"`, `inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"`; se limpia tras enviarse.
- Token guardado solo en memoria del servicio Angular.
