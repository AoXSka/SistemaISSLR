; ContaVe Pro - Inno Setup Script
; Professional Windows Installer Generator

#define MyAppName "ContaVe Pro"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "ContaVe Solutions"
#define MyAppURL "https://www.contavepro.com"
#define MyAppExeName "ContaVe Pro.exe"
#define MyAppId "ContaVePro"

[Setup]
; Información básica de la aplicación
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/soporte
AppUpdatesURL={#MyAppURL}/descargas
AppCopyright=Copyright (C) 2024 {#MyAppPublisher}

; Configuración de instalación
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE.md
InfoBeforeFile=docs\INSTALLER_GUIDE.md
OutputDir=release
OutputBaseFilename=ContaVe-Pro-Setup-{#MyAppVersion}
SetupIconFile=electron\assets\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Configuración de Windows
MinVersion=10.0
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
DisableProgramGroupPage=yes
DisableWelcomePage=no

; Configuración de usuario
ChangesAssociations=yes
ChangesEnvironment=no
CreateUninstallRegKey=yes
ShowLanguageDialog=no

; Opciones de instalación
UninstallDisplayName={#MyAppName} - Sistema de Gestión Contable
UninstallFilesDir={app}\uninstall

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear un acceso directo en el &escritorio"; GroupDescription: "Accesos directos:"; Flags: unchecked
Name: "quicklaunchicon"; Description: "Crear un acceso directo en el &inicio rápido"; GroupDescription: "Accesos directos:"; Flags: unchecked

[Files]
; Aplicación principal (binarios de Electron)
Source: "release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Recursos adicionales
Source: "database\*"; DestDir: "{app}\database"; Flags: ignoreversion recursesubdirs
Source: "docs\USER_MANUAL.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "LICENSE.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Quita el parámetro IconFilename para usar el icono incrustado en el EXE
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Manual de Usuario"; Filename: "{app}\docs\USER_MANUAL.md"
Name: "{group}\Soporte Técnico"; Filename: "{#MyAppURL}/soporte"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Ejecutar {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{userappdata}\{#MyAppName}"

[Registry]
; Registro de aplicación
Root: HKLM; Subkey: "SOFTWARE\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey

; Asociación de archivos .cvpro
Root: HKCR; Subkey: ".cvpro"; ValueType: string; ValueName: ""; ValueData: "ContaVeProFile"; Flags: uninsdeletevalue
Root: HKCR; Subkey: "ContaVeProFile"; ValueType: string; ValueName: ""; ValueData: "Archivo de ContaVe Pro"; Flags: uninsdeletekey
Root: HKCR; Subkey: "ContaVeProFile\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "ContaVeProFile\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Code]
function IsUpgrade(): Boolean;
var
  S: String;
begin
  Result := (RegQueryStringValue(HKLM, 'SOFTWARE\{#MyAppPublisher}\{#MyAppName}', 'Version', S)) and (S <> '{#MyAppVersion}');
end;

function InitializeSetup(): Boolean;
begin
  if IsUpgrade() then
  begin
    MsgBox('Se detectó una versión anterior de {#MyAppName}. Se actualizará automáticamente.', mbInformation, MB_OK);
  end;
  Result := True;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpWelcome then
  begin
    WizardForm.NextButton.Caption := '&Siguiente >';
    WizardForm.BackButton.Caption := '< &Atrás';
    WizardForm.CancelButton.Caption := 'Cancelar';
  end;
end;