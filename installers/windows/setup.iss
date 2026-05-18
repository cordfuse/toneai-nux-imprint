#define MyAppName "toneai-nux-imprint"
#define MyAppPublisher "Steve Krisjanovs"
#define MyAppURL "https://github.com/steve-krisjanovs/toneai-nux-imprint"
#define MyAppExeName "toneai-nux-imprint.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\toneai-nux-imprint
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=toneai-nux-imprint
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ChangesEnvironment=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\..\toneai-nux-imprint-win-x64.exe"; DestDir: "{app}"; DestName: "toneai-nux-imprint.exe"; Flags: ignoreversion

[Registry]
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; \
  ValueType: expandsz; ValueName: "Path"; \
  ValueData: "{olddata};{app}"; \
  Check: NeedsAddPath(ExpandConstant('{app}'))

[Code]
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE,
    'SYSTEM\CurrentControlSet\Control\Session Manager\Environment',
    'Path', OrigPath)
  then begin
    Result := True;
    exit;
  end;
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;

[Icons]
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[Messages]
FinishedLabel=ToneAI-NUX has been installed.%n%nOpen a new Command Prompt or PowerShell and run:%n%n    toneai-nux-imprint%n%nThe wizard will download ToneAI and get you running in minutes.
