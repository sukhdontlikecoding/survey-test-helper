### Initialization Step

- Attaches Observer to the default invalid-answer error alert box. `addErrorAlertListener`, `alertFoundHandler`
    - Adds custom `Alert` instance for error.
    - Pauses the 'Auto-run'
    - Hides the default alert box by clicking on the `btn-default`

- Avoid & Force commands processing
```
        commandsContainer = {
            'force': {
                'QX': [1,2,3],
                'QY': [1,2,3]
            },
            'avoid': {
                'QZ': [1,2,3]
            }
        }
```

- `initStorage` - Set variables values from localstorage/sessionstorage. Sync any missed things. 
    - `localstorage`
        - `activity`
        - `hiddenValue`
    - `sessionStorage`
        - `prevQuestion`
        - `attempts`
        - `cmdObjStr`

- `initUI` -


## Feature:

- Add a text box to enter question code
- When a new question page is loaded then check if the QCode matches the queried one.
- If matches, then turn off the auto-runner.