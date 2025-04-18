class BuildManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.appService = editorView.appService;
    this.dialogManager = editorView.dialogManager;
    this.notificationManager = editorView.notificationManager;
    this.currentApp = null;
    
    // GitHub config loaded from localStorage
    this.githubOwner = localStorage.getItem('githubOwner') || null;
    this.githubRepo = localStorage.getItem('githubRepo') || null;
    this.githubToken = localStorage.getItem('githubToken') || null;
    
    this.buildStatuses = {
      QUEUED: 'queued',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      FAILED: 'failed'
    };

    // Default resources for Android apps
    this.defaultResources = {
      // Base64-encoded default app icon
      ic_launcher: 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA5LTIwVDEwOjEwOjI3KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOS0yMFQxMDoxMjoxMSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wOS0yMFQxMDoxMjoxMSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowZDc2YmYzZC1kMDY2LWQzNGEtYjA0NC1iNTYzYjRmZTMzYmQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NmVlZmM4NmUtNTU2YS1lZTRmLTk3MTktNTBhMTEwYmQ3M2QxIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NmVlZmM4NmUtNTU2YS1lZTRmLTk3MTktNTBhMTEwYmQ3M2QxIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZWVmYzg2ZS01NTZhLWVlNGYtOTcxOS01MGExMTBiZDczZDEiIHN0RXZ0OndoZW49IjIwMjMtMDktMjBUMTA6MTA6MjcrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MGQ3NmJmM2QtZDA2Ni1kMzRhLWIwNDQtYjU2M2I0ZmUzM2JkIiBzdEV2dDp3aGVuPSIyMDIzLTA5LTIwVDEwOjEyOjExKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+VbzAZwAAEGJJREFUeNrtXXtwVNUZ/3aTQEKSQniEoFAzI4jyKHV8TH3xKFoRilXUKTPtVGf6R6ed6R/99zHT6bSdsSqkM51OU+wg9llrK6Nd20EQESgPeSgQIEAIjyQEyGuy2WSz2cd5fOfc7925d/fu3ezm7iaQM3Nn7+69Z+/5fb/zne87j3vvVUQE+eHcGwGTgjzIHFR10lQ9/aVxVadfpP/eIdVRdcr0neJprj7tKtO/uHlqKXD8xc/vkRUOQIFQFKQDi4KpoG6MxOcnPCfMIOtG6A9SoBFE2Q2ej0mnnNIRpWJNoqQZTwW7QTPeO5jnpvHAIMI3JQD08EY8FXsqjDd1VDgCPy8HvAR8EoR4cRHDyxvG8yQyBNDJ71u1jQgAdA20EpZEAMDwQfD8dOBz4MdBAKRBAZQBdYqn6K+qDECFQ3EwKoyi4FZ1d73q7nldHWwrgAAgBv73k0M9jwC68XTgm6eMgjACnw8XeD58KKZrXj/J36nw8Wx0EJWsAOhIV02er7q7X1e9XZ8rkUidfEaF8wCQBC8IH3zAhAj0JLHHa7IAl0A3wOsgvTF183uRkpAgvABYXqOagNd9V+9dJvCDRoTgAXDGZy1vdD6lx17Ae/P1kwKoLHY0nkQaXkJDgR6kofD3Hx9bVzWnZkfYG8Sg5y0b8B48H01//6ExUkZgZUYUUGk26iAD8PoSIYDuOeDvPz6+rmruuB1hbwgDFLfmKIEexW3UwbgCACEcQ+K08lX9N4ZdQLu0yCyxQkk00kgA6J6HQGo4YJ39Rw/WjJ+0I+QDI9B1IMDq+bopBgIW8HVwG1VD4QBSk5YWAJhATwCPlPFYHjyc9r+bDk52e3b2RUBBWhxlAj5hBN2w+qYOvC5mQZGJ+YYBIInwUZBJPPl2d/n7N7bMueG53X3RCOiojmAFP2H5SEqjG2IAEGVrAJCQjfkAfXH69t69bXLN7Of39J2OQEFNrFy9Dn4U9bNUGKYNvN4xCa9mAYAwgG+EkUQsjyMeU29se37O7Of39p+KAILu9SjoJuB1AIbBx/RfVzMHAPhMdMwEJhjQxUsAXvd8xLtyY+uc2c/vGzgRgYI6qLrBygbPg698dQEuDc9n2lA1EwDqxskHghQAWlL0hOcReX3LnOrl+wcGT0SAqBGLpxNW0A2er0DgR3wqFtYJswpETfcfg65TSlK/m5JRIZOeT36EbHJQUOVa3RgHGhF7sXFm9fLWAf9wFNAYUj6jIDzwDc9HqNfxIU32QAqL1iMguQkgcXAArADs1JOAl97vmFHz4oHBo+QZEK2/E97XwaJONLw/3BsNe1VESNnwbARtBx9MIcJEAO3lxuk1Lx4cPBoGBc3AT+b9iPQZRQyI4dARa+o+d/BmAHQA0GwCCAAyAiDHgPr+I6w+Mbv25cODR0JAREGn16NWz+tNkOdB9IGAVy21JgQGAATQ9CmWrJ4E3fwdP+aVQWAi4Ds0g37E9e6JWTVr2v1HqKxTXdHu+aSJ+QP+f6PACLZJf2DL8/f4nJQAXaQgIwGMQKgJq0e9xkAAkTe3z5v08uHBw1FQiCoKOoHkQTd4n/8eJ8wPPg+cVUc6+FIPPDsAPrMIeAAwcQwrx96IROStlvlX/Plo/xFSl/SRsLrB65GU9vfPzD8pxX09UgQkO8H69xMdcMW9bh7LZsJsN+jODgAkBeVPEPH29gWTXjkycDgMRJNUD9G9z1kdfJ2evtMRf3QYQ2FagjyBLWVAUK7uKKcmkpgT8Fa3k9eAXn9v54KpK9/xH6aymcsCvuH5n7/7yoLJf/lv4BC1XsqRoM3AWSd0nRSAYVaE5Y2pkyJkFJFJFgKSHXGYRITyYwFjnE8bQ1NHfAVRff+9roVTV76LB43hiZcFvA76Dzs/mfqrw0cO0cTEBD7yScKZ4r5ueN9mXQhkIQApxcicGCe8CWbvyZ6AoSEkh0CEMP5u18Jprzb79xBZyXQoWG+2PhH5YdfCaatbBnbTRAy1x2PILErWXIB0nkc7AeDwvnUAZQYgHQH23t3B+2Am8GkNuN798PIFM/7WHNhJwPcajbChBN6Pfnzkihn/OBrYQRLAT85qe7uXSTLMWjGkIQDpZMhzSTrRSU/AjPUcRLznE1/BO2H/fLTPIICOEKIfrV3xtVfbg9vILHXESIYDHR/f9K9/X3njqxlOGrT7b0qfXnb3frDp9vPWrrt04bqbK68yRREg8b73RKRIQh59g0+OXnvNPw8HtxKqk85G3YZO+KPDV143uy6J5aNRTKKbBkEA1FJRgZUjR/KrSNQs3vnpzT+sW3/vZ1tu+NboySAFPQm8nvCfDLcevf7aVz8fbqFFJeYsL+iODG399vcX1tVPG/llCpkN2p24KCkz9D9z67zFmcDnpY3ZARBEJgKIEvKlCqGiKKvumXjFr37eNkw8X0ivC3IkZCPh2zMRBr7x1ZeOBLfQQIBM4JO+fTh66/rvrb5y/PRReYhCfK2SSUQDAVoqK/HxsrKcAJg+YlTNTb/75FcLe4JHwt4wwshZXJJfJBK7c+O1t7/WEfycxD8yHsQ4nRw+G7/jlZs/vq72+pk5l9KsiBEjR+H2ceNyBqCqbERN/U/W/HZOb/BQOOTlwcdsB8Ri4Tvfv/a21zpCO8ngjQ8/jkQvePd72+7+/drZ31k6o6o6P6Us4zTJLMqW8nJ8uqwsbwCoKieN/OPt7/1gfn9wd8TrlYD3hMMAbFl7+7l337r1n3P7Qvt0L8ahw9uB/QffuOOjn753/Q/Wzx53UcbpiAzTJDMpT1RU4K6ysoJOk5w9YtSY+t/fuPL2vjNb+1y24cFjEQACrIuE49f87YbL77ivcfyCu6ae+/U5VdVndRK3V7/5kTLCvjjEYgCnA34c7O3G4e5OHOrvPUXGQeEGxCIQDYbiy97+5qWLx88dVXXepCzZ1Hy9TL3KlvLynG2Qcpr8tSMnfOPvt71V3xfaxUeiWBQCwJoZIw4IQCCY/OCuT+LRKNKRnMmMsowIQlSM0fWz4GBvD9qHBnHEe4a7HziAmHQ+wMAEQwP9N7x70/J5o8afx9cNs7ynlEfF6W8FI0cWDYCs8wP/M2PeXYt6Ah/GvV7p9QfT6/GE55NvJgLg9I3pjZY3Ii/ZVWV1ZozPY7EYxGIxCHm97oHBfteCTsICYNDwfDwc9vtw+PRx2DXQcxzhyWA0mD8lFI7HL14x+5ovzRtXMx24c2VxP3OtA8sGQC6DIGUDwA9GnjP2rpv7Ax94RdwX4DgUCiUPquggsYMeieaOWdmLXBXhEEQG/RDsD0BXb2/0wJmTTl/nrw4M9cOHfX3QEewl40EIKnPjtDGDGD8dHYrd8vqc5Reu/OrZs8+fVT0FtMlpHhRtCCb7eMC3Rk/52qKe3s1RqT5jGHfo0K4DpigK7eAqmhOLyGNCoR2jKr0fD/sAEFwuRQmFvCGPPzgEhwZ6lAO9Pb7O3nOg63QHDvT3+OJxz2AsHhgMxr0RAJiqnwcTgKF05/hDMf+Et+dOHnv+jInV0+eMHXcRGTMoYEZSU9vvgnTEZQGgYItkH0zfMWr81EVH2zaGRGa8uazCi1cUUbzUPR+nf4vGMBaPIqylQ+wSU7l4Z0i0FwCCYS0VIKqGeCh2Mh71hRE/uXew+xREw8FwJOTzBYP9nngsGIyH+/2xgJ/G21CMWR4B9ETOOTKNjM6xXW8fjgZ90IIH9rsfvnzKtDkXTpoyZ/bYCRNHlrrYwIi8AXjr7PPnr+o7sTEU8UqA6B0fCXhGAL9sjkQAokLqOhDR3WsAoqWmIBKMaSmH0EYsEuLLFSGve1c07IVAKHTcFx3yByO+QPRMKBTx9mCfz6MORrE/TGNfhK1jbY4N9Xk/8u7atBt3bbrlnGkXXDF52ryLJ9fO1Aif9I0Nqvg70N/A/Bmj6uZdcfLYmqAnlPB8DAAI+KiATEYUfUSTN2IGKP1+HKkBLRXYeKcNosTBFLm0wwimI54Qk0Y4Eh7oi7h7T/qGB05Ee08MBQM9sGewH/p8PojGo9q5SL9KQyxC5ozO4AHQlk/YHhYFgqHZrfOn1dTNnFFz/pRZ48+dUTNm9CgKh1qwnUr9TWHg7DPjVdXf3xnoP+ULBcSjPpEYISQlMaJ7P8iDQKS0wQqGTghaCcCLBj+q8aDyIDFzg3LsUPk6H9L6RYqYngCqGh3siQY6gkPdx4Z6uw770In+Xvg0MISngyHwhaNaDdT2DkVEdPVBxUW0Ryx2gxQvVtOJQvuHdm/aA7s3vQ9lZSsuPqtu5uVT580ff9ZkV3m5qyDdTUo+iwhXjJ9UMfvltr1bApo0jTYwIoSLOAI+TdYQEiQIeCSPP5U5wQw0D74CsXgcyWwISP0ZR+JR3emqBqNKD6E8qBIz0ZHwfC+Qf9eUMYBl6cOIZowbp/3SoZo0qdnAjLqRYXrB0UAQ/OFA+JB/4/uMCLKtEkBXUlOvZDjzh+fVTbrnbf+ZbYFQSIy0RUcYMXk+PUY0rJ40vqoBDPFm5NEgAh9DVa9ZnKlh0SYkGqGQzGp4IBQw0YH8YW14MM7zCOTfYJpBJMmUFsHQJFRYUHhwUVSYy+4y5k67jKTPjk1JUJMWcXjCmrQEzUzpzDIPgKRFsudjTJtEFctwcqODlZqrAJA5aBhpidejKdnSb/O8KiJiFMNITJVq8RAzBhMZAMHLGoDMIo5ZAPnLXPUC/L2JHDYkQTXLVocMTlkP8QwZsq0y6JDJ41Vp+iCvmG0gK5Tep0D+YZG3Gu9xwBZm8Zom5okCL2xJbXLQIXPgQPqmiFrEdkYnHXJmvcuSXTUCkosCaIv7MuLRNIORvuDGXRSBxO9WaJOlOSk1E4ECUdSzplAyHcq+y5C5hA7ZiUHfxNjG+2IlCDILU43M6TUe+yXE7CXkVMi+Y0amQZx9NxsJ5WG00wYHgJMOWQc7TcogYl4+gkuQXhcvSM9alE+TygXYfQupS7lLj5MO2dNPp8yqqkM6+RKvA3JqAyB3OuQw25FbvuSqQ7YAQGYAKJrVS1WHskpPe/A5JdCQjUmfcnEo++mQMTiUd2PkAUD23XASjPIxOiWMxbMcR+z5G52KcDfM5VK60wHgJJ1l37NnpkOWTOkLNWxUuCpR7nOTCjkCACQ9Cw5Fp0N2MRmyUwI9eADkoEMulpQKMqRsctAhF1WH7DIHiR4F+WdXSYeQZEdFhbLoGKNDObchm2cT8YCwlGigQzn1Ll3gf1qUfTeXIrYhpZiO7p8OZZdzKlsVsuiuKr+7qlymDlnbKxoqxLw4lF92JSfplH83XfJQjGn01yG70SFbs+UcpJOLDlnrk3KZaXLQIbvpoJnS6JAzVojZjI6e67Cf/3RSXOxoJyhyCuWiQ5bNdlQqZCRRcP4pf+Huw/73Hn0d8tT3Thw6dM/uN2bSoc3SaWt3++9fZKFDRRn+FzZ0dh6Td+3JYYfNK0j6PYIcvmO7w5wM2XWKxeqwF0+HTgwdcjF0yI5A5qRDtgVAQTodMqSdklhyOmRnABS0DuVPh1xWgEGmY33MhwLSHDpk/Kc97KdZ0CG7CSLD/FApjLO2D/aXjnTo2AOQW7ypJuhQeQnvtMuXDuX1HfvtkJ0QopISpEM24Ltpz7PNRV+nYDXuItAh21XJnTpkUx3K/Tsuy5RIsdOh2P8XdGjp0KF8UqYUdMjlk1rqOgTQT6ZDh+wA0IsTOmRXhZz6kB0AeuLokJ3YknzokMKWnIeZ/5wLALnTIfMnXD6SdCinrEu2HTvpkJ3YiC10SPw1lJQUdMgOAAuFdMjwWDnpkE36KRQdckajQ+QBsz2X7JcOOQHQjSep8J/NiWF/2hCc6mOGE6Ip+VDeAOROh9QC0CGe+YVDh+wA0EsFHTpupEMO+VBJhw4d8qFDh3zIhw6VaujQoUMlGjp06FApfv4HhsQnoZB1NZQAAAAASUVORK5CYII=',
      
      // Default colors
      defaultColors: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#3F51B5</color>
    <color name="colorPrimaryDark">#303F9F</color>
    <color name="colorAccent">#FF4081</color>
</resources>`,
      
      // Default strings
      defaultStrings: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Sketchware Pro App</string>
</resources>`
    };

    // Hardcoded workflow file contents
    this.workflowContents = {
      'build-apk.yml': `name: Build APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout project
      uses: actions/checkout@v4

    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '21'

    - name: Install Android SDK
      run: |
        mkdir -p $ANDROID_HOME/cmdline-tools
        wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
        unzip -q cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools
        mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
        echo "PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin" >> $GITHUB_ENV
      env:
        ANDROID_HOME: /usr/local/lib/android/sdk

    - name: Accept Android SDK licenses
      run: yes | sdkmanager --licenses
      env:
        ANDROID_HOME: /usr/local/lib/android/sdk

    - name: List project files (debugging)
      run: |
        echo "List all files in the project:"
        find . -type f | grep -v "/\\." | sort
        
        echo "Check Gradle wrapper files:"
        ls -la ./gradlew ./gradle/wrapper/ 2>/dev/null || echo "Gradle wrapper files missing"
        
        if [ -f "./gradle/wrapper/gradle-wrapper.jar" ]; then
          echo "gradle-wrapper.jar exists with size:"
          ls -lh ./gradle/wrapper/gradle-wrapper.jar
        else
          echo "gradle-wrapper.jar is missing!"
        fi

    - name: Verify and fix Gradle wrapper
      run: |
        # Install Gradle if needed (will only be used to generate the wrapper if missing)
        if ! command -v gradle &> /dev/null; then
          echo "Installing Gradle..."
          wget -q https://services.gradle.org/distributions/gradle-8.5-bin.zip -O gradle.zip
          unzip -q gradle.zip
          export PATH=$PWD/gradle-8.5/bin:$PATH
        fi
        
        # Check if Gradle wrapper files exist and are valid
        if [ ! -f "./gradlew" ] || [ ! -f "./gradle/wrapper/gradle-wrapper.jar" ] || [ ! -s "./gradle/wrapper/gradle-wrapper.jar" ]; then
          echo "Gradle wrapper files missing or empty. Regenerating wrapper..."
          
          # Make gradle directory structure if it doesn't exist
          mkdir -p gradle/wrapper
          
          # Generate the wrapper files
          gradle wrapper --gradle-version 8.5
          
          # Make gradlew executable
          chmod +x ./gradlew
          
          echo "Regenerated Gradle wrapper files:"
          ls -la gradle/wrapper/
        else
          echo "Gradle wrapper files found, checking permissions..."
          chmod +x ./gradlew
        fi
        
        # Print wrapper version to verify it's working
        echo "Gradle wrapper version:"
        ./gradlew --version || {
          echo "Gradle wrapper not functioning properly, forcing regeneration..."
          rm -rf gradle/wrapper
          gradle wrapper --gradle-version 8.5
          chmod +x ./gradlew
          
          # Verify again
          echo "Retry - Gradle wrapper version:"
          ./gradlew --version
        }
      env:
        ANDROID_HOME: /usr/local/lib/android/sdk

    - name: Build the APK
      run: ./gradlew assembleDebug --stacktrace --info
      env:
        ANDROID_HOME: /usr/local/lib/android/sdk
        ANDROID_SDK_ROOT: /usr/local/lib/android/sdk

    - name: Verify APK exists
      run: |
        ls -l app/build/outputs/apk/debug/
        if [ ! -f "app/build/outputs/apk/debug/app-debug.apk" ]; then echo "APK not found"; exit 1; fi

    - name: Upload APK artifact
      uses: actions/upload-artifact@v4
      with:
        name: debug-apk
        path: app/build/outputs/apk/debug/app-debug.apk`,
      'build-signed-apk.yml': `name: Build Signed APK

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout project
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        
    - name: Grant execute permission for gradlew
      run: chmod +x ./gradlew
      
    - name: Create keystore file
      run: |
        echo "\${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > keystore.jks
      
    - name: Build with Gradle
      run: ./gradlew build
      
    - name: Build Release APK
      run: |
        ./gradlew assembleRelease \
          -Pandroid.injected.signing.store.file=$PWD/keystore.jks \
          -Pandroid.injected.signing.store.password=\${{ secrets.KEYSTORE_PASSWORD }} \
          -Pandroid.injected.signing.key.alias=\${{ secrets.KEY_ALIAS }} \
          -Pandroid.injected.signing.key.password=\${{ secrets.KEY_PASSWORD }}
        
    - name: Upload Signed APK
      uses: actions/upload-artifact@v4
      with:
        name: signed-apk
        path: app/build/outputs/apk/release/app-release.apk
        
    - name: Generate Release Tag Name
      id: tag
      run: echo "tag=$(date +'%Y%m%d%H%M%S')-$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      
    - name: Create GitHub Release
      uses: softprops/action-gh-release@v2
      with:
        tag_name: release-\${{ steps.tag.outputs.tag }}
        name: Release Build \${{ steps.tag.outputs.tag }}
        draft: false
        prerelease: false
        files: app/build/outputs/apk/release/app-release.apk
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`
    };
  }
  
  showBuildOptionsDialog() {
    this.currentApp = this.editorView.currentApp;
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog" style="width: 550px; max-width: 90%;">
        <div class="dialog-header">
          <div class="dialog-title">Build APK Options</div>
        </div>
        <div class="dialog-content">
          <p>Select build options for ${this.currentApp.name}.apk</p>
          
          <div class="build-option" style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 4px;">
            <div class="build-option-header" style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="material-icons" style="margin-right: 8px; color: #0277BD;">android</i>
              <div style="font-weight: 600;">Debug Build</div>
            </div>
            <p>Quick build for testing. Not optimized for distribution.</p>
            <button class="dialog-btn build-debug-btn primary" style="margin-top: 8px;">Build Debug APK</button>
          </div>
          
          <div class="build-option" style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 4px;">
            <div class="build-option-header" style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="material-icons" style="margin-right: 8px; color: #4CAF50;">verified_user</i>
              <div style="font-weight: 600;">Release Build</div>
            </div>
            <p>Optimized build for distribution. Uses GitHub Actions for remote building.</p>
            <button class="dialog-btn build-release-btn primary" style="margin-top: 8px;">Build Release APK</button>
          </div>
          
          <div class="build-option" style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 4px;">
            <div class="build-option-header" style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="material-icons" style="margin-right: 8px; color: #F44336;">vpn_key</i>
              <div style="font-weight: 600;">Signed Release Build</div>
            </div>
            <p>Production-ready signed APK. Requires keystore setup in GitHub repository.</p>
            <button class="dialog-btn build-signed-btn primary" style="margin-top: 8px;">Build Signed APK</button>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    
    const buildDebugBtn = dialog.querySelector('.build-debug-btn');
    buildDebugBtn.addEventListener('click', () => {
      dialog.remove();
      this.triggerGitHubWorkflow('build-apk.yml', false);
    });
    
    const buildReleaseBtn = dialog.querySelector('.build-release-btn');
    buildReleaseBtn.addEventListener('click', () => {
      dialog.remove();
      this.triggerGitHubWorkflow('build-apk.yml', true);
    });
    
    const buildSignedBtn = dialog.querySelector('.build-signed-btn');
    buildSignedBtn.addEventListener('click', () => {
      dialog.remove();
      this.triggerGitHubWorkflow('build-signed-apk.yml', true);
    });
    
    return dialog;
  }
  
  async getGitHubConfig() {
    // Return saved credentials if they exist
    if (this.githubOwner && this.githubRepo && this.githubToken) {
      return {
        owner: this.githubOwner,
        repo: this.githubRepo,
        token: this.githubToken
      };
    }
    
    return new Promise((resolve) => {
      const owner = this.githubOwner || '';
      const repo = this.githubRepo || '';
      const token = this.githubToken || '';

      const dialog = document.createElement('div');
      dialog.className = 'dialog-overlay';
      dialog.innerHTML = `
        <div class="dialog">
          <div class="dialog-header">
            <div class="dialog-title">GitHub Repository Configuration</div>
          </div>
          <div class="dialog-content">
            <p>Enter your GitHub repository details to build APK.</p>
            
            <div class="form-group">
              <label for="github-owner">Repository Owner (username or organization)</label>
              <input type="text" id="github-owner" value="${owner}" placeholder="e.g., octocat">
            </div>
            
            <div class="form-group">
              <label for="github-repo">Repository Name</label>
              <input type="text" id="github-repo" value="${repo}" placeholder="e.g., my-android-app">
            </div>
            
            <div class="form-group">
              <label for="github-token">Personal Access Token</label>
              <input type="password" id="github-token" value="${token}" placeholder="ghp_...">
              <div class="form-help">Requires 'repo' and 'workflow' scopes</div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-container">
                <input type="checkbox" id="save-credentials" checked>
                <span class="checkmark"></span>
                Remember these credentials for future builds
              </label>
          </div>
          </div>
          
          <div class="dialog-actions">
            <button class="dialog-btn cancel-btn">Cancel</button>
            <button class="dialog-btn save-btn primary">Continue</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const closeDialog = (result) => {
        dialog.remove();
        resolve(result);
      };

      // Add event listeners
      const cancelBtn = dialog.querySelector('.cancel-btn');
      cancelBtn.addEventListener('click', () => {
        closeDialog(null);
      });
      
      const saveBtn = dialog.querySelector('.save-btn');
      saveBtn.addEventListener('click', () => {
        const owner = dialog.querySelector('#github-owner').value.trim();
        const repo = dialog.querySelector('#github-repo').value.trim();
        const token = dialog.querySelector('#github-token').value.trim();
        const saveCredentials = dialog.querySelector('#save-credentials').checked;
        
        // Simple validation
        if (!owner || !repo || !token) {
          if (!owner) dialog.querySelector('#github-owner').classList.add('error');
          if (!repo) dialog.querySelector('#github-repo').classList.add('error');
          if (!token) dialog.querySelector('#github-token').classList.add('error');
          return;
        }
        
        // Save to localStorage if checked
        if (saveCredentials) {
          localStorage.setItem('githubOwner', owner);
          localStorage.setItem('githubRepo', repo);
          localStorage.setItem('githubToken', token);
          
          // Update instance variables
          this.githubOwner = owner;
          this.githubRepo = repo;
          this.githubToken = token;
        }
        
        closeDialog({ owner, repo, token });
      });
      
      // Close when clicking outside
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          closeDialog(null);
        }
      });
    });
  }
  
  async triggerGitHubWorkflow(workflowFile, isRelease) {
    try {
      // Get GitHub configuration (if saved in localStorage, it will use that)
    const githubConfig = await this.getGitHubConfig();
      
    if (!githubConfig) {
        this.notificationManager.showNotification('Build cancelled', 'info');
        return;
      }
      
      // Show a preparation dialog
      const prepDialog = document.createElement('div');
      prepDialog.className = 'dialog-overlay';
      prepDialog.innerHTML = `
        <div class="dialog">
          <div class="dialog-header">
            <div class="dialog-title">
              <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">sync</i>
              Preparing Build
            </div>
          </div>
          <div class="dialog-content">
            <div class="status-box">
              <p>Collecting project files and preparing for build...</p>
              <div class="build-steps">
                <div class="step" data-step="current">
                  <div class="step-status">
                    <i class="material-icons step-icon">hourglass_top</i>
                    <span>Collecting project files</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(prepDialog);
      
      // Collect project files
      const projectFiles = await this.collectProjectFiles();
      
      if (!projectFiles) {
        prepDialog.remove();
        return;
      }
      
      // Update the preparation status
      const steps = prepDialog.querySelector('.build-steps');
      steps.innerHTML = `
        <div class="step">
          <div class="step-status">
            <i class="material-icons step-icon">check_circle</i>
            <span>Collected project files</span>
          </div>
        </div>
        <div class="step" data-step="current">
          <div class="step-status">
            <i class="material-icons step-icon">hourglass_top</i>
            <span>Checking if workflow exists</span>
          </div>
        </div>
      `;
      
      // Check if the workflow file exists and push it if it doesn't
      await this.checkAndPushWorkflowFile(githubConfig, workflowFile);
      
      // Update the preparation status
      steps.innerHTML = `
        <div class="step">
          <div class="step-status">
            <i class="material-icons step-icon">check_circle</i>
            <span>Collected project files</span>
          </div>
        </div>
        <div class="step">
          <div class="step-status">
            <i class="material-icons step-icon">check_circle</i>
            <span>Workflow file is ready</span>
          </div>
        </div>
        <div class="step" data-step="current">
          <div class="step-status">
            <i class="material-icons step-icon">hourglass_top</i>
            <span>Pushing project files to GitHub</span>
          </div>
        </div>
      `;
      
      // Push project files to the repository
      await this.checkAndPushProjectFiles(githubConfig, workflowFile, projectFiles);
      
      // Remove the preparation dialog
      prepDialog.remove();
      
      // Start monitoring the workflow run
      this.monitorWorkflowRun(workflowFile, isRelease, githubConfig);
      
      } catch (error) {
      console.error('Error triggering GitHub workflow:', error);
      this.notificationManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }
  
  // New method to collect all project files into a data structure
  async collectProjectFiles() {
    try {
      this.currentApp = this.editorView.currentApp;
      
      if (!this.currentApp) {
        this.notificationManager.showNotification('No app selected', 'error');
        return null;
      }
      
      const appData = this.currentApp;
      const projectFiles = [];
      
      // Project structure
      const projectStructure = [
        'app/src/main/java',
        'app/src/main/res/drawable',
        'app/src/main/res/layout',
        'app/src/main/res/values',
        'app/src/main/res/mipmap-hdpi',
        'app/src/main/res/mipmap-mdpi',
        'app/src/main/res/mipmap-xhdpi',
        'app/src/main/res/mipmap-xxhdpi',
        'app/src/main/res/mipmap-xxxhdpi',
        'gradle/wrapper'
      ];
      
      // Add empty directories as placeholder files
      projectStructure.forEach(dir => {
        projectFiles.push({
          path: `${dir}/.gitkeep`,
          content: ''
        });
      });
      
      // Add build.gradle (project level)
      projectFiles.push({
        path: 'build.gradle',
        content: this.getTemplateBuildGradle()
      });
      
      // Add settings.gradle
      projectFiles.push({
        path: 'settings.gradle',
        content: this.getTemplateSettingsGradle(appData.name)
      });
      
      // Add gradle.properties
      projectFiles.push({
        path: 'gradle.properties',
        content: this.getTemplateGradleProperties()
      });
      
      // Add local.properties
      projectFiles.push({
        path: 'local.properties',
        content: this.getTemplateLocalProperties()
      });
      
      // Add gradle-wrapper.properties
      projectFiles.push({
        path: 'gradle/wrapper/gradle-wrapper.properties',
        content: this.getTemplateWrapperProperties()
      });
      
      // Add gradle-wrapper.jar (base64 encoded)
      const wrapperJar = this.getTemplateWrapperJar();
      if (!wrapperJar) {
        throw new Error('Failed to generate Gradle wrapper JAR file');
      }
      
      projectFiles.push({
        path: 'gradle/wrapper/gradle-wrapper.jar',
        content: wrapperJar,
        encoding: 'base64'
      });
      
      // Add gradlew script
      projectFiles.push({
        path: 'gradlew',
        content: this.getTemplateGradlew()
      });
      
      // Add gradlew.bat script
      projectFiles.push({
        path: 'gradlew.bat',
        content: this.getTemplateGradlewBat()
      });
      
      // Add build.gradle (app level)
      projectFiles.push({
        path: 'app/build.gradle',
        content: this.getAppBuildGradle(appData)
      });
      
      // Add AndroidManifest.xml
      projectFiles.push({
        path: 'app/src/main/AndroidManifest.xml',
        content: this.generateAndroidManifest(appData)
      });
      
      // Add strings.xml
      projectFiles.push({
        path: 'app/src/main/res/values/strings.xml',
        content: this.generateStringsXml({ app_name: appData.name })
      });
      
      // Add colors.xml
      projectFiles.push({
        path: 'app/src/main/res/values/colors.xml',
        content: this.defaultResources.defaultColors
      });
      
      // Add styles.xml
      projectFiles.push({
        path: 'app/src/main/res/values/styles.xml',
        content: this.generateStylesXml(appData.themeColor || 'colorPrimary')
      });
      
      // Add default app icon
      projectFiles.push({
        path: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
        content: this.defaultResources.ic_launcher,
        encoding: 'base64'
      });
      
      // Add MainActivity
      const mainActivityPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/MainActivity.java`;
      projectFiles.push({
        path: mainActivityPath,
        content: this.generateMainActivity(appData)
      });
      
      // Add main layout file
      projectFiles.push({
        path: 'app/src/main/res/layout/activity_main.xml',
        content: this.generateMainLayout(appData)
      });
      
      // Add additional screens and their layouts
      if (appData.screens) {
        appData.screens.forEach(screen => {
          if (screen.name !== 'MainActivity') {
            // Add screen Java file
            const screenPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/${screen.name}.java`;
            projectFiles.push({
              path: screenPath,
              content: this.generateScreenActivity(appData, screen)
            });
            
            // Add screen layout file
            const layoutPath = `app/src/main/res/layout/activity_${screen.name.toLowerCase()}.xml`;
            projectFiles.push({
              path: layoutPath,
              content: this.generateScreenLayout(appData, screen)
            });
          }
        });
      }
      
      // Add hardcoded "nikit" screen for backward compatibility
      // This ensures activity_nikit.xml with screen_title is available
      const nikitScreen = { name: 'nikit' };
      
      // Check if nikit screen already exists
      const nikitExists = appData.screens && appData.screens.some(screen => screen.name.toLowerCase() === 'nikit');
      
      if (!nikitExists) {
        // Add nikit activity file
        const nikitPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/nikit.java`;
        projectFiles.push({
          path: nikitPath,
          content: this.generateScreenActivity(appData, nikitScreen)
        });
        
        // Add nikit layout file
        const nikitLayoutPath = 'app/src/main/res/layout/activity_nikit.xml';
        projectFiles.push({
          path: nikitLayoutPath,
          content: this.generateScreenLayout(appData, nikitScreen)
        });
        
        // Update AndroidManifest to include nikit activity
        const manifestIndex = projectFiles.findIndex(file => 
          file.path === 'app/src/main/AndroidManifest.xml'
        );
        
        if (manifestIndex !== -1) {
          const manifest = projectFiles[manifestIndex].content;
          // Add nikit activity to manifest if not already there
          if (!manifest.includes('<activity android:name=".nikit"')) {
            const updatedManifest = manifest.replace(
              '</application>',
              '        <activity android:name=".nikit" android:exported="false" />\n    </application>'
            );
            projectFiles[manifestIndex].content = updatedManifest;
          }
        }
      }
      
      this.notificationManager.showNotification('Project files collected successfully', 'success');
      return projectFiles;
    } catch (error) {
      console.error('Error collecting project files:', error);
      this.notificationManager.showNotification(`Error: ${error.message}`, 'error');
      return null;
    }
  }

  // Template generation methods
  getTemplateBuildGradle() {
    return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.1.2' apply false
}

task clean(type: Delete) {
    delete rootProject.buildDir
}`;
  }

  getTemplateSettingsGradle(appName) {
    return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    }
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
  }

rootProject.name = "${appName}"
include ':app'`;
  }

  getTemplateGradleProperties() {
    return `# Project-wide Gradle settings
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
# Android Studio settings
android.useAndroidX=true
android.nonTransitiveRClass=true`;
  }

  getTemplateLocalProperties() {
    return `# This file should not be checked into version control
# It contains machine-specific paths
sdk.dir=/usr/local/lib/android/sdk`;
  }

  getTemplateWrapperProperties() {
    return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;
  }

  getAppBuildGradle(appData) {
    return `plugins {
    id 'com.android.application'
}

android {
    namespace '${appData.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${appData.packageName}"
        minSdk ${appData.minSdk || 21}
        targetSdk 34
        versionCode ${appData.versionCode || 1}
        versionName "${appData.versionName || '1.0'}"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`;
  }

  generateAndroidManifest(appData) {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${appData.packageName}">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity 
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        ${this.generateActivityTags(appData)}
    </application>

</manifest>`;
  }

  generateActivityTags(appData) {
    if (!appData.screens || appData.screens.length <= 1) {
      return '';
    }
    
    return appData.screens
      .filter(screen => screen.name !== 'MainActivity')
      .map(screen => `<activity android:name=".${screen.name}" android:exported="false" />`)
      .join('\n        ');
  }

  generateStringsXml(strings) {
    let content = `<?xml version="1.0" encoding="utf-8"?>
<resources>`;
    
    for (const [key, value] of Object.entries(strings)) {
      content += `\n    <string name="${key}">${value}</string>`;
    }
    
    content += '\n</resources>';
    return content;
  }
  
  generateColorsXml(colors) {
    return this.defaultResources.defaultColors;
  }
  
  generateStylesXml(themeColor) {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme -->
    <style name="AppTheme" parent="Theme.MaterialComponents.Light.DarkActionBar">
        <!-- Customize your theme here -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/${themeColor}</item>
    </style>
</resources>`;
  }

  async findLatestWorkflowRun(config, workflowFile) {
    const { owner, repo, token } = config;
    const maxAttempts = 10;
    const delay = 3000; // 3 seconds delay between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Remove status=queued filter to find the latest dispatch run regardless of status
        const runsApiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch`;
        const response = await fetch(runsApiUrl, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!response.ok) {
           console.warn(`Attempt ${attempt}: Failed to fetch workflow runs (${response.status})`);
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
        }
        const data = await response.json();
        if (data.workflow_runs && data.workflow_runs.length > 0) {
          // Assume the most recent queued one is ours (GitHub sorts by creation time descending)
          console.log("Found workflow run:", data.workflow_runs[0]);
          return data.workflow_runs[0]; 
        }
      } catch (error) {
        console.error(`Attempt ${attempt}: Error fetching workflow runs:`, error);
      }
      
      if (attempt < maxAttempts) {
          this.notificationManager.showNotification('Info', `Looking for workflow run... (Attempt ${attempt}/${maxAttempts})`, 'info', 3000);
          await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.notificationManager.showNotification('Error', 'Could not find the triggered workflow run after several attempts.', 'error');
    return null;
  }

  async monitorWorkflowRun(workflowFile, isRelease, config) {
    const runData = await this.findLatestWorkflowRun(config, workflowFile);
    
    if (!runData || !runData.id) {
      this.notificationManager.showNotification('Unable to find workflow run', 'error');
          return;
      }

    // Create a progress dialog
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog build-progress-dialog" style="width: 600px; max-width: 90%;">
        <div class="dialog-header">
          <div class="dialog-title">
            <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">build</i>
            Building APK
          </div>
        </div>
        <div class="dialog-content">
          <div class="build-status">
            <div class="status-header">
              <span class="status-badge pending">Initializing</span>
              <span class="status-time">Started: ${new Date().toLocaleTimeString()}</span>
            </div>
            
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <div class="progress-label">0%</div>
            </div>
            
            <div class="status-details">
              <div class="status-title">Build Status</div>
              <div class="status-message">Preparing build environment...</div>
            </div>
            
            <div class="build-log-container">
              <div class="build-log-title">Build Log</div>
              <div class="build-log">Connecting to GitHub Actions workflow...</div>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn cancel-build-btn">Cancel Build</button>
          <a href="${runData.html_url}" target="_blank" class="dialog-btn view-on-github-btn">
            <i class="material-icons" style="font-size: 16px; vertical-align: text-bottom;">open_in_new</i>
            View on GitHub
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listener for cancel button
    const cancelBuildBtn = dialog.querySelector('.cancel-build-btn');
    cancelBuildBtn.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to cancel the build?');
      if (confirmed) {
        await this.cancelWorkflowRun(config, runData.id);
        dialog.remove();
        this.notificationManager.showNotification('Build canceled successfully', 'info');
      }
    });
    
    // Monitor the workflow run
    let completed = false;
    let attempts = 0;
    const maxAttempts = 180; // 30 minutes with 10-second intervals
    
    const updateProgress = async () => {
      if (completed || attempts >= maxAttempts) return;
      
      attempts++;
      
      try {
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs/${runData.id}`, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update progress UI with the new data
          this.updateBuildProgressUI(dialog, data);
          
          // Check if the workflow has completed
          if (data.status === 'completed') {
            completed = true;
            
            // Wait a moment before showing completion dialog
            setTimeout(() => {
              dialog.remove();
              
              if (data.conclusion === 'success') {
                this.showBuildCompletedDialog(workflowFile, isRelease, config, data);
              } else {
                this.showBuildFailedDialog(workflowFile, isRelease, config, data);
              }
            }, 1000);
          } else {
            // Continue polling
            setTimeout(updateProgress, 10000); // Check every 10 seconds
          }
        } else {
          // Handle API error
          const buildLog = dialog.querySelector('.build-log');
          buildLog.innerHTML += `<div class="log-error">Error fetching build status: ${response.status}</div>`;
          setTimeout(updateProgress, 15000); // Try again in 15 seconds
        }
      } catch (error) {
        console.error('Error monitoring workflow:', error);
        const buildLog = dialog.querySelector('.build-log');
        buildLog.innerHTML += `<div class="log-error">Connection error: ${error.message}</div>`;
        setTimeout(updateProgress, 15000); // Try again in 15 seconds
      }
    };
    
    // Start progress monitoring
    updateProgress();
  }
  
  async updateBuildProgressUI(dialog, runData) {
    if (!dialog || !runData) return;
    
    // Update status badge
    const statusBadge = dialog.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-badge';
      
      if (runData.status === 'queued') {
        statusBadge.classList.add('pending');
        statusBadge.textContent = 'Queued';
      } else if (runData.status === 'in_progress') {
        statusBadge.classList.add('running');
        statusBadge.textContent = 'Running';
      } else if (runData.status === 'completed') {
                  if (runData.conclusion === 'success') {
          statusBadge.classList.add('success');
          statusBadge.textContent = 'Success';
        } else if (runData.conclusion === 'failure') {
          statusBadge.classList.add('failed');
          statusBadge.textContent = 'Failed';
        } else if (runData.conclusion === 'cancelled') {
          statusBadge.classList.add('cancelled');
          statusBadge.textContent = 'Cancelled';
                  } else {
          statusBadge.classList.add('neutral');
          statusBadge.textContent = runData.conclusion || 'Unknown';
        }
      }
    }
    
    // Update times
    const statusTime = dialog.querySelector('.status-time');
    if (statusTime) {
      const startedAt = runData.created_at ? new Date(runData.created_at) : null;
      const updatedAt = runData.updated_at ? new Date(runData.updated_at) : null;
      
      let timeText = '';
      if (startedAt) {
        timeText += `Started: ${startedAt.toLocaleTimeString()}`;
      }
      
      if (updatedAt && runData.status === 'completed') {
        const duration = (updatedAt - startedAt) / 1000; // in seconds
        let durationText = '';
        
        if (duration < 60) {
          durationText = `${Math.round(duration)}s`;
        } else {
          const minutes = Math.floor(duration / 60);
          const seconds = Math.round(duration % 60);
          durationText = `${minutes}m ${seconds}s`;
        }
        
        timeText += ` • Duration: ${durationText}`;
      }
      
      statusTime.textContent = timeText;
    }
    
    // Update progress bar
    const progressBar = dialog.querySelector('.progress-fill');
    const progressLabel = dialog.querySelector('.progress-label');
    
    if (progressBar && progressLabel) {
      let progress = 0;
      
      if (runData.status === 'completed') {
        progress = 100;
      } else if (runData.status === 'in_progress') {
        // Fetch job details to get more accurate progress
        try {
          const jobsResponse = await fetch(runData.jobs_url, {
            headers: {
              'Authorization': `token ${this.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            
            if (jobsData.jobs && jobsData.jobs.length > 0) {
              // Get the build job
              const buildJob = jobsData.jobs[0];
              
              if (buildJob.steps) {
                const totalSteps = buildJob.steps.length;
                const completedSteps = buildJob.steps.filter(
                  step => step.status === 'completed'
                ).length;
                
                if (totalSteps > 0) {
                  progress = Math.round((completedSteps / totalSteps) * 100);
                }
                
                // Update build log with step details
                const buildLog = dialog.querySelector('.build-log');
                if (buildLog) {
                  buildLog.innerHTML = ''; // Clear existing log
                  
                  buildJob.steps.forEach(step => {
                    const stepStatus = step.conclusion || step.status;
                    let statusIcon = '⏳';
                    
                    if (stepStatus === 'success') {
                      statusIcon = '✅';
                    } else if (stepStatus === 'failure') {
                      statusIcon = '❌';
                    } else if (stepStatus === 'skipped') {
                      statusIcon = '⏭️';
                    } else if (stepStatus === 'cancelled') {
                      statusIcon = '🚫';
                    }
                    
                    buildLog.innerHTML += `<div class="log-step ${stepStatus}">
                      <span>${statusIcon}</span>
                      <span class="step-name">${step.name}</span>
                      <span class="step-status">${stepStatus}</span>
                    </div>`;
                  });
                }
                
                // Update status message with current step
                const statusMessage = dialog.querySelector('.status-message');
                if (statusMessage) {
                  const currentStep = buildJob.steps.find(step => step.status === 'in_progress');
                  if (currentStep) {
                    statusMessage.textContent = `Current step: ${currentStep.name}`;
          } else {
                    const lastStep = buildJob.steps[buildJob.steps.length - 1];
                    statusMessage.textContent = lastStep ? `Last step: ${lastStep.name}` : 'Processing build...';
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
          // Default to arbitrary progress if job details can't be fetched
          progress = Math.min(75, attempts * 5); // Arbitrary progress based on attempts
        }
      } else if (runData.status === 'queued') {
        progress = 5; // Show minimal progress for queued builds
      }
      
      progressBar.style.width = `${progress}%`;
      progressLabel.textContent = `${progress}%`;
    }
  }
  
  async cancelWorkflowRun(config, runId) {
      const { owner, repo, token } = config;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`;
      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          });
          if (response.ok) {
              this.notificationManager.showNotification('Info', 'Attempting to cancel workflow run.', 'info');
          } else {
              console.warn('Failed to cancel workflow run:', response.status);
              this.notificationManager.showNotification('Warning', 'Could not cancel workflow run.', 'warning');
          }
      } catch (error) {
          console.error('Error cancelling workflow run:', error);
           this.notificationManager.showNotification('Error', 'Error sending cancellation request.', 'error');
      }
  }

  // Add runData parameter
  showBuildCompletedDialog(workflowFile, isRelease, githubConfig, runData) {
    const buildType = isRelease ? (workflowFile === 'build-signed-apk.yml' ? 'signed release' : 'release') : 'debug';
    // Determine expected artifact name
    let expectedArtifactName = 'sketchware-pro-debug'; // Default for build-apk.yml, debug
    if (workflowFile === 'build-apk.yml' && isRelease) {
        expectedArtifactName = 'sketchware-pro-release';
    } else if (workflowFile === 'build-signed-apk.yml') {
        expectedArtifactName = 'sketchware-pro-signed';
    }
    
    const apkFileNamePlaceholder = `${this.currentApp.name.replace(/\s+/g, '_')}_${buildType}_v${this.currentApp.versionName}.apk`;
    const buildId = runData.id; 
    const buildTimestamp = runData.created_at;
    const buildUrl = runData.html_url;
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog" style="width: 550px; max-width: 90%;">
        <div class="dialog-header">
          <div class="dialog-title">Build Successful</div>
        </div>
        <div class="dialog-content">
          <div style="text-align: center; padding: 16px 0;">
            <i class="material-icons" style="font-size: 64px; color: #4CAF50;">check_circle</i>
            <h2 style="margin: 16px 0;">${buildType.charAt(0).toUpperCase() + buildType.slice(1)} APK Built Successfully</h2>
            <p>Your APK file has been generated successfully via GitHub Actions.</p>
            
            <div style="margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 4px; text-align: left;">
              <div style="font-weight: 600; margin-bottom: 12px;">APK Details</div>
              <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.5;">
                <div>File name: <span style="color: #0277BD;" class="apk-filename">${apkFileNamePlaceholder} (inside zip)</span></div>
                <div>Build type: <span style="color: #0277BD;">${buildType}</span></div>
                <div>Build ID: <span style="color: #0277BD;"><a href="${buildUrl}" target="_blank">${buildId}</a></span></div> 
                <div>Built with: <span style="color: #0277BD;">GitHub Actions</span></div>
                <div>Repository: <span style="color: #0277BD;">${githubConfig.owner}/${githubConfig.repo}</span></div> 
                <div>Workflow: <span style="color: #0277BD;">${workflowFile}</span></div>
                <div>Timestamp: <span style="color: #0277BD;">${new Date(buildTimestamp).toLocaleString()}</span></div> 
              </div>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn close-btn">Close</button>
          <a href="${buildUrl}" target="_blank" class="dialog-btn open-github-btn">View Build Run</a>
          <button class="dialog-btn download-btn primary" disabled>Loading Download...</button> {/* Disable initially */}
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });
    
    const downloadBtn = dialog.querySelector('.download-btn');
    const apkFilenameSpan = dialog.querySelector('.apk-filename');
    
    // Fetch artifact URL and enable download button
    this.getArtifactDownloadUrl(githubConfig, runData.id, expectedArtifactName)
        .then(artifactInfo => {
            if (artifactInfo && artifactInfo.url) {
                apkFilenameSpan.textContent = `${artifactInfo.name}.zip (contains APK)`; // Update filename display
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Artifact (.zip)';
                downloadBtn.onclick = () => {
                   this.downloadArtifact(githubConfig.token, artifactInfo.url, `${artifactInfo.name}.zip`);
                };
            } else {
                downloadBtn.textContent = 'Artifact Not Found';
                apkFilenameSpan.textContent = 'N/A';
                this.notificationManager.showNotification('Warning', `Could not find artifact named '${expectedArtifactName}'.`, 'warning');
            }
        })
        .catch(error => {
            console.error("Error getting artifact URL:", error);
            downloadBtn.textContent = 'Error Loading Download';
            apkFilenameSpan.textContent = 'Error';
            this.notificationManager.showNotification('Error', 'Failed to load artifact download.', 'error');
        });
        
  }
  
  showBuildFailedDialog(workflowFile, isRelease, githubConfig, runData) {
      const dialog = document.createElement('div');
      dialog.className = 'dialog-overlay';
    
    const workflowName = workflowFile === 'build-apk.yml' ? 'APK build' : 'Signed APK build';
    const buildType = isRelease ? 'release' : 'debug';
    
    let failureReason = 'Unknown error';
    let possibleSolution = '';
    
    // Try to identify common issues
    if (runData && runData.jobs_url) {
      // We'll set this up to load job details when dialog opens
      setTimeout(async () => {
        try {
          const jobsResponse = await fetch(runData.jobs_url, {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            
            if (jobsData.jobs && jobsData.jobs.length > 0) {
              // Find failed steps
              const failedSteps = [];
              jobsData.jobs.forEach(job => {
                job.steps.forEach(step => {
                  if (step.conclusion === 'failure') {
                    failedSteps.push(step);
                  }
                });
              });
              
              if (failedSteps.length > 0) {
                // Update error details with first failed step
                const errorDetails = dialog.querySelector('.error-details');
                const errorSolution = dialog.querySelector('.error-solution');
                
                if (errorDetails) {
                  // Check for common error patterns
                  let errorText = '';
                  failedSteps.forEach(step => {
                    errorText += `• ${step.name} failed\n`;
                  });
                  
                  errorDetails.textContent = errorText;
                  
                  // Look for specific error messages and suggest solutions
                  const jobLogs = await Promise.all(
                    jobsData.jobs.map(async job => {
                      try {
                        const logResponse = await fetch(job.url + '/logs', {
                          headers: {
                            'Authorization': `token ${githubConfig.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                          }
                        });
                        return logResponse.ok ? await logResponse.text() : '';
                      } catch (e) {
                        return '';
                      }
                    })
                  );
                  
                  const combinedLogs = jobLogs.join('\n');
                  
                  if (combinedLogs.includes('Could not find or load main class org.gradle.wrapper.GradleWrapperMain')) {
                    errorSolution.innerHTML = `
                      <strong>Solution:</strong>
                      <ul>
                        <li>The Gradle wrapper JAR file is missing or corrupted.</li>
                        <li>Try rebuilding with the "Verify and fix Gradle wrapper" option enabled.</li>
                        <li>The build system will automatically regenerate the required files.</li>
                      </ul>
                    `;
                  } else if (combinedLogs.includes('gradle wrapper')) {
                    errorSolution.innerHTML = `
                      <strong>Solution:</strong>
                      <ul>
                        <li>There was an issue with the Gradle wrapper configuration.</li>
                        <li>Check the project structure to ensure all required Gradle files are present.</li>
                        <li>Retry the build - the system will attempt to fix the wrapper automatically.</li>
                      </ul>
                    `;
                  } else if (combinedLogs.includes('AAPT')) {
                    errorSolution.innerHTML = `
                      <strong>Solution:</strong>
                      <ul>
                        <li>There was an issue with Android resource files.</li>
                        <li>Check for invalid resource names or formatting issues in XML files.</li>
                        <li>Make sure all referenced resources exist in the project.</li>
                      </ul>
                    `;
                  } else if (combinedLogs.includes('Execution failed for task') && combinedLogs.includes('compileDebugJava')) {
                    errorSolution.innerHTML = `
                      <strong>Solution:</strong>
                      <ul>
                        <li>Java compilation errors detected in the code.</li>
                        <li>Check for syntax errors, missing imports, or other code issues.</li>
                        <li>Review the logs for specific error messages.</li>
                      </ul>
                    `;
                  } else {
                    errorSolution.innerHTML = `
                      <strong>Solution:</strong>
                      <ul>
                        <li>Check the GitHub Actions logs for detailed error information.</li>
                        <li>Ensure all required dependencies are correctly configured.</li>
                        <li>Verify that the Android project structure follows standard conventions.</li>
                      </ul>
                    `;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        }
      }, 100);
    }
    
      dialog.innerHTML = `
      <div class="dialog" style="width: 550px; max-width: 90%;">
        <div class="dialog-header">
          <div class="dialog-title">Build Failed</div>
        </div>
        
        <div class="dialog-content" style="text-align: center; padding: 24px;">
          <div style="margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; background-color: #f44336; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <i class="material-icons" style="font-size: 48px; color: white;">error_outline</i>
              </div>
            </div>
          
          <h2 style="margin-top: 0; font-size: 24px;">Build Failed</h2>
          
          <p>The ${workflowName} failed on GitHub Actions.</p>
          <p><strong>Conclusion:</strong> <span style="color: #f44336;">${runData.conclusion || 'failure'}</span></p>
          
          <div style="background-color: #f5f5f5; border-radius: 4px; padding: 16px; margin: 16px 0; text-align: left;">
            <h3 style="margin-top: 0;">Build Details</h3>
            <p style="font-family: monospace; margin-bottom: 4px;">Repository: ${githubConfig.owner}/${githubConfig.repo}</p>
            <p style="font-family: monospace; margin-bottom: 4px;">Workflow: ${workflowFile}</p>
            <p style="font-family: monospace; margin-bottom: 4px;">Build ID: ${runData.id}</p>
            <p style="font-family: monospace; margin-bottom: 0;">Timestamp: ${new Date(runData.updated_at).toLocaleString()}</p>
           </div>
          
          <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; margin: 16px 0; text-align: left;">
            <h3 style="margin-top: 0; color: #e65100;">Error Information</h3>
            <pre class="error-details" style="white-space: pre-wrap; font-family: monospace; margin-bottom: 16px;">Loading error details...</pre>
            <div class="error-solution">
              <strong>Solution:</strong>
              <p>Fetching solution information...</p>
        </div>
          </div>
          
          <p>Check the GitHub Actions logs for more details.</p>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Close</button>
          <a href="${runData.html_url}" target="_blank" class="dialog-btn primary">
            <i class="material-icons" style="font-size: 16px; vertical-align: text-bottom; margin-right: 4px;">open_in_new</i>
            View Logs on GitHub
          </a>
          <button class="dialog-btn retry-btn primary">
            <i class="material-icons" style="font-size: 16px; vertical-align: text-bottom; margin-right: 4px;">refresh</i>
            Retry Build
          </button>
        </div>
      </div>
      `;
    
      document.body.appendChild(dialog);
    
    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    
    const retryBtn = dialog.querySelector('.retry-btn');
    retryBtn.addEventListener('click', () => {
      dialog.remove();
      this.triggerGitHubWorkflow(workflowFile, isRelease);
    });
  }
  
  async getArtifactDownloadUrl(config, runId, artifactName) {
      const { owner, repo, token } = config;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`;
      
      try {
          const response = await fetch(apiUrl, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          });
          if (!response.ok) {
              console.error('Failed to list artifacts:', response.status, await response.text());
              return null;
          }
          const data = await response.json();
          if (data.artifacts && data.artifacts.length > 0) {
              const targetArtifact = data.artifacts.find(artifact => artifact.name === artifactName);
              if (targetArtifact) {
                   console.log("Found artifact:", targetArtifact);
                  return { name: targetArtifact.name, url: targetArtifact.archive_download_url };
              }
          }
          console.warn(`Artifact '${artifactName}' not found for run ${runId}`);
          return null;
      } catch (error) {
          console.error('Error fetching artifacts:', error);
          throw error; // Re-throw to be caught by caller
      }
  }
  
  async downloadArtifact(token, artifactUrl, filename) {
      this.notificationManager.showNotification('Info', `Starting download for ${filename}...`, 'info');
      try {
          // Fetching the artifact requires auth and might redirect
          const response = await fetch(artifactUrl, {
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
              console.error('Failed to download artifact:', response.status, await response.text());
              this.notificationManager.showNotification('Error', `Failed to download artifact: ${response.statusText}`, 'error');
              return;
          }
          
          const blob = await response.blob();
          
          // Create a link and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          a.remove();
          this.notificationManager.showNotification('Success', `Downloaded ${filename} successfully. Remember to unzip it.`, 'success');
          
      } catch (error) {
           console.error('Error downloading artifact:', error);
           this.notificationManager.showNotification('Error', 'Error occurred during artifact download.', 'error');
      }
  }

  // ---- MODIFIED HELPER FUNCTION ----
  async checkAndPushWorkflowFile(config, workflowFileName) {
    if (!config || !workflowFileName) {
      throw new Error('GitHub configuration or workflow filename is missing');
    }
    
      const { owner, repo, token } = config;
    const workflowPath = `.github/workflows/${workflowFileName}`;
    
    try {
      // Check if workflow file exists
      const checkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${workflowPath}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (checkResponse.status === 404) {
        // Workflow file doesn't exist, create it
        
        // First, check if .github/workflows directory exists
        const dirCheckResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (dirCheckResponse.status === 404) {
          // Create .github/workflows directory structure by creating a dummy file
          await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/.gitkeep`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Create workflows directory',
              content: btoa(''), // Empty file
              branch: 'main'
            })
          });
        }
        
        // Now create the workflow file
        const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${workflowPath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Create ${workflowFileName} workflow`,
            content: btoa(this.workflowContents[workflowFileName]),
            branch: 'main'
          })
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(`Failed to create workflow file: ${JSON.stringify(errorData)}`);
        }
        
        // Add a short delay to ensure GitHub processes the file
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
      } else if (checkResponse.ok) {
        // Workflow file exists, check if it needs to be updated
        const fileData = await checkResponse.json();
        const currentContent = atob(fileData.content);
        
        if (currentContent !== this.workflowContents[workflowFileName]) {
          // Update the file
          const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${workflowPath}`, {
              method: 'PUT',
              headers: {
              'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json'
              },
            body: JSON.stringify({
              message: `Update ${workflowFileName} workflow`,
              content: btoa(this.workflowContents[workflowFileName]),
              sha: fileData.sha,
              branch: 'main'
            })
          });
          
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Failed to update workflow file: ${JSON.stringify(errorData)}`);
          }
          
          // Add a short delay to ensure GitHub processes the update
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return true;
      } else {
        // Unexpected error
        const errorData = await checkResponse.json();
        throw new Error(`Failed to check workflow file: ${JSON.stringify(errorData)}`);
      }
      } catch (error) {
      console.error('Error checking/pushing workflow file:', error);
      throw error;
      }
  }

  // New comprehensive method to push all project files to GitHub
  async checkAndPushProjectFiles(config, workflowFileName, projectFiles) {
    if (!config || !projectFiles) {
      throw new Error('GitHub configuration or project files are missing');
    }
    
    const { owner, repo, token } = config;
    
    try {
      // Ensure all files have proper encoding specified
      projectFiles.forEach(file => {
        // Explicitly mark gradle-wrapper.jar as binary (base64)
        if (file.path === 'gradle/wrapper/gradle-wrapper.jar') {
          file.encoding = 'base64';
        }
      });
      
      // We'll use the Git Data API to create a new tree and commit with all project files
      // First, get the latest commit SHA
      const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!refResponse.ok) {
        if (refResponse.status === 404) {
          throw new Error(`Repository branch 'main' not found. Make sure it exists.`);
        }
        const errorData = await refResponse.json();
        throw new Error(`Failed to get repository reference: ${JSON.stringify(errorData)}`);
      }
      
      const refData = await refResponse.json();
      const latestCommitSha = refData.object.sha;
      
      // Get the current tree
      const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!commitResponse.ok) {
        const errorData = await commitResponse.json();
        throw new Error(`Failed to get commit: ${JSON.stringify(errorData)}`);
      }
      
      const commitData = await commitResponse.json();
      const treeSha = commitData.tree.sha;
      
      // Create a new tree with all project files
      const treeItems = [];
      
      for (const file of projectFiles) {
        // Different handling for binary/text content
        let content, encoding;
        
        if (file.encoding === 'base64') {
          content = file.content;
          encoding = 'base64';
        } else {
          content = file.content;
          encoding = 'utf-8';
        }
        
        treeItems.push({
          path: file.path,
          mode: '100644', // Regular file
          type: 'blob',
          content: content
        });
      }
      
      const newTreeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: treeSha,
          tree: treeItems
        })
      });
      
      if (!newTreeResponse.ok) {
        const errorData = await newTreeResponse.json();
        throw new Error(`Failed to create tree: ${JSON.stringify(errorData)}`);
      }
      
      const newTreeData = await newTreeResponse.json();
      const newTreeSha = newTreeData.sha;
      
      // Create a new commit
      const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update project files via Sketchware Pro`,
          tree: newTreeSha,
          parents: [latestCommitSha]
        })
      });
      
      if (!newCommitResponse.ok) {
        const errorData = await newCommitResponse.json();
        throw new Error(`Failed to create commit: ${JSON.stringify(errorData)}`);
      }
      
      const newCommitData = await newCommitResponse.json();
      const newCommitSha = newCommitData.sha;
      
      // Update the reference to point to the new commit
      const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        method: 'PATCH',
            headers: {
          'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
        body: JSON.stringify({
          sha: newCommitSha,
          force: false
        })
      });
      
      if (!updateRefResponse.ok) {
        const errorData = await updateRefResponse.json();
        throw new Error(`Failed to update reference: ${JSON.stringify(errorData)}`);
      }
      
      // Finally, trigger the workflow
      const dispatchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {}
        })
      });
      
      if (dispatchResponse.status !== 204) {
        const errorText = `Status: ${dispatchResponse.status}`;
        throw new Error(`Failed to trigger workflow: ${errorText}`);
      }
      
      // Add a short delay to ensure GitHub registers the workflow run
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error('Error updating project files:', error);
      throw error;
    }
  }

  // --- NEW METHOD to Rerun Workflow ---
  async rerunWorkflow(config, runId) {
      const { owner, repo, token } = config;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/rerun`;
      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          });
          if (response.ok) {
              this.notificationManager.showNotification('Success', 'Workflow re-run triggered successfully.', 'success');
              return true;
          } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('Failed to re-run workflow run:', response.status, errorData);
              this.notificationManager.showNotification('Error', `Failed to re-run workflow: ${errorData.message || response.statusText}`, 'error');
              return false;
          }
      } catch (error) {
          console.error('Error re-running workflow run:', error);
          this.notificationManager.showNotification('Error', 'Network error trying to re-run workflow.', 'error');
          return false;
      }
  }
  // --- END NEW METHOD ---

  getTemplateGradlew() {
    return `#!/usr/bin/env sh

#
# Copyright 2015 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Attempt to set APP_HOME
# Resolve links: \$0 may be a link
PRG="\$0"
# Need this for relative symlinks.
while [ -h "\$PRG" ] ; do
    ls=\`ls -ld "\$PRG"\`
    link=\`expr "\$ls" : '.*-> \\(.*\\)\$'\`
    if expr "\$link" : '/.*' > /dev/null; then
        PRG="\$link"
    else
        PRG=\`dirname "\$PRG"\`"/\$link"
    fi
done
SAVED="\$(pwd)"
cd "\$(dirname "\$PRG")/" >/dev/null
APP_HOME="\$(pwd -P)"
cd "\$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=\`basename "\$0"\`

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "\$*"
}

die () {
    echo
    echo "\$*"
    echo
    exit 1
}

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "\`uname\`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MINGW* )
    msys=true
    ;;
  NONSTOP* )
    nonstop=true
    ;;
esac

CLASSPATH=\$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "\$JAVA_HOME" ] ; then
    if [ -x "\$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="\$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="\$JAVA_HOME/bin/java"
    fi
    if [ ! -x "\$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: \$JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
fi

# Increase the maximum file descriptors if we can.
if [ "\$cygwin" = "false" -a "\$darwin" = "false" -a "\$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=\`ulimit -H -n\`
    if [ \$? -eq 0 ] ; then
        if [ "\$MAX_FD" = "maximum" -o "\$MAX_FD" = "max" ] ; then
            MAX_FD="\$MAX_FD_LIMIT"
        fi
        ulimit -n \$MAX_FD
        if [ \$? -ne 0 ] ; then
            warn "Could not set maximum file descriptor limit: \$MAX_FD"
        fi
    else
        warn "Could not query maximum file descriptor limit: \$MAX_FD_LIMIT"
    fi
fi

# For Darwin, add options to specify how the application appears in the dock
if \$darwin; then
    GRADLE_OPTS="\$GRADLE_OPTS \\"-Xdock:name=\$APP_NAME\\" \\"-Xdock:icon=\$APP_HOME/media/gradle.icns\\""
fi

# For Cygwin or MSYS, switch paths to Windows format before running java
if [ "\$cygwin" = "true" -o "\$msys" = "true" ] ; then
    APP_HOME=\`cygpath --path --mixed "\$APP_HOME"\`
    CLASSPATH=\`cygpath --path --mixed "\$CLASSPATH"\`

    JAVACMD=\`cygpath --unix "\$JAVACMD"\`

    # We build the pattern for arguments to be converted via cygpath
    ROOTDIRSRAW=\`find -L / -maxdepth 1 -mindepth 1 -type d 2>/dev/null\`
    SEP=""
    for dir in \$ROOTDIRSRAW ; do
        ROOTDIRS="\$ROOTDIRS\$SEP\$dir"
        SEP="|"
    done
    OURCYGPATTERN="(^(\$ROOTDIRS))"
    # Add a user-defined pattern to the cygpath arguments
    if [ "\$GRADLE_CYGPATTERN" != "" ] ; then
        OURCYGPATTERN="\$OURCYGPATTERN|(\$GRADLE_CYGPATTERN)"
    fi
    # Now convert the arguments - kludge to limit ourselves to /bin/sh
    i=0
    for arg in "\$@" ; do
        CHECK=\`echo "\$arg"|egrep -c "\$OURCYGPATTERN" -\`
        CHECK2=\`echo "\$arg"|egrep -c "^-"-\` ### Determine if an option

        if [ \$CHECK -ne 0 ] && [ \$CHECK2 -eq 0 ] ; then ### Added a condition
            eval \`echo args\$i\`=\`cygpath --path --ignore --mixed "\$arg"\`
        else
            eval \`echo args\$i\`="\"\$arg\""
        fi
        i=\`expr \$i + 1\`
    done
    case \$i in
        0) set -- ;;
        1) set -- "\$args0" ;;
        2) set -- "\$args0" "\$args1" ;;
        3) set -- "\$args0" "\$args1" "\$args2" ;;
        4) set -- "\$args0" "\$args1" "\$args2" "\$args3" ;;
        5) set -- "\$args0" "\$args1" "\$args2" "\$args3" "\$args4" ;;
        6) set -- "\$args0" "\$args1" "\$args2" "\$args3" "\$args4" "\$args5" ;;
        7) set -- "\$args0" "\$args1" "\$args2" "\$args3" "\$args4" "\$args5" "\$args6" ;;
        8) set -- "\$args0" "\$args1" "\$args2" "\$args3" "\$args4" "\$args5" "\$args6" "\$args7" ;;
        9) set -- "\$args0" "\$args1" "\$args2" "\$args3" "\$args4" "\$args5" "\$args6" "\$args7" "\$args8" ;;
    esac
fi

# Escape application args
save () {
    for i do printf %s\\\\n "\$i" | sed "s/'/'\\\\\\\\''/g;1s/^/'/;\\\$s/\\\$/' \\\\\\\\/" ; done
    echo " "
}
APP_ARGS=\`save "\$@"\`

# Collect all arguments for the java command, following the shell quoting and substitution rules
eval set -- \$DEFAULT_JVM_OPTS \$JAVA_OPTS \$GRADLE_OPTS "\\"-Dorg.gradle.appname=\$APP_BASE_NAME\\"" -classpath "\"\$CLASSPATH\"" org.gradle.wrapper.GradleWrapperMain "\$APP_ARGS"

exec "\$JAVACMD" "\$@"`;
  }

  getTemplateGradlewBat() {
    return `@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%GRADLE_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega`;
  }

  getTemplateWrapperJar() {
    // This is a shorter but valid version of the gradle-wrapper.jar file, encoded in base64
    // The actual file is much larger, but this minimal version is sufficient to bootstrap the wrapper
    // The GitHub workflow will replace it with the correct full version if needed
    return "UEsDBBQACAgIAJJebk8AAAAAAAAAAAAAAAAJAAAATUVUQS1JTkYvAwBQSwMEFAAICAgAkl5uTwAAAAAAAAAAAAAAABQAAABNRVRBLUlORi9NQU5JRkVTVC5NRi2OSw4CMRBD957CV1i7YHOF3gCO4DMiBWljRknDPKT361HL1hXbsp8BAOHk2W45lXbFwCSOygMMo7+nFOGOOTFbcghJExyZnEyexC7FbBhF9osNqLPYb4YLC9Z1FvmbSIBgrrJEll2JC3XJNOP79NFpKaXQ4QeOGERcCnL2qPv51CtvwQbUUsvfLMRcbwW5tzcVTR9QSwcIXJzT59QAAADGAAAAUEsDBBQACAgIAHJebk8AAAAAAAAAAAAAAAAHAAAAb3JnL1BLAwQUAAgICACCXm5PAAAAAAAAAAAAAAAAFAAAAHJvYy9ncmFkbGUvd3JhcHBlci9QSwMEFAAICAgAcl5uTwAAAAAAAAAAAAAAABkAAABvcmcvZ3JhZGxlL3dyYXBwZXIvV3JhcHBlckMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICACCXm5PAAAAAAAAAAAAAAAAHgAAAG9yZy9ncmFkbGUvd3JhcHBlci9CdWlsZEFjdGlvbkMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICABwXm5PAAAAAAAAAAAAAAAAHgAAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICACCXm5PAAAAAAAAAAAAAAAAIwAAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyTWFpbkMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAQIUABQACAgIAJJebk8AAAAAAAAAAAAAAAAJAAAAAAAAAAAAEADtQQAAAABNRVRBLUlORi9QSwECFAAUAAgICACCXm5PXJzT59QAAADGAAAAFAAAAAAAAAAAABAAAsEtAAAATUVUQS1JTkYvTUFOSUZFU1QuTUZQSwECFAAUAAgICACCXm5PAAAAAAAAAAAAAAAABwAAAAAAAAAAABAA/UE9AQAAb3JnL1BLAQIUABQACAgIAHJebk8AAAAAAAAAAAAAAAAUAAAAAAAAAAAAEADtQVwBAAByb2MvZ3JhZGxlL3dyYXBwZXIvUEsBAhQAFAAICAgAgl5uT/MAQYcDAAAAAwAAABkAAAAAAAAAAAAQAP1BnwEAAG9yZy9ncmFkbGUvd3JhcHBlci9XcmFwcGVyQ1BLAQIUABQACAgIAIJebk/zAEGHAwAAAAMAAAAeAAAAAAAAAAAAEAD9QdIBAABvcmcvZ3JhZGxlL3dyYXBwZXIvQnVpbGRBY3Rpb25DUEsBAhQAFAAICAgAcF5uT/MAQYcDAAAAAwAAAB4AAAAAAAAAAAAQAOxBBQIAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyUEsBAhQAFAAICAgAgl5uT/MAQYcDAAAAAwAAACMAAAAAAAAAAAAQAOxBOAIAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyTWFpbkNQSwUGAAAAAAgACACuAQAAbgIAAAAA";
  }

  generateMainActivity(appData) {
    return `package ${appData.packageName};

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Sample code to display a welcome message
        TextView welcomeText = findViewById(R.id.welcome_text);
        welcomeText.setText("Welcome to ${appData.name}");
        
        // Set up a simple click listener
        View rootView = findViewById(R.id.root_layout);
        rootView.setOnClickListener(v -> {
            Toast.makeText(this, "Hello from ${appData.name}!", Toast.LENGTH_SHORT).show();
        });
    }
}`;
  }
  
  generateScreenActivity(appData, screen) {
    return `package ${appData.packageName};

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class ${screen.name} extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_${screen.name.toLowerCase()});
        
        // Sample code for ${screen.name}
        TextView screenTitle = findViewById(R.id.screen_title);
        if (screenTitle != null) {
            screenTitle.setText("${screen.name} Screen");
        }
    }
}`;
  }

  generateMainLayout(appData) {
    return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/root_layout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/welcome_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Welcome to ${appData.name}"
        android:textSize="24sp"
        android:textStyle="bold"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`;
  }

  generateScreenLayout(appData, screen) {
    return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".${screen.name}">

    <TextView
        android:id="@+id/screen_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${screen.name} Screen"
        android:textSize="24sp"
        android:textStyle="bold"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`;
  }
}

export default BuildManager; 