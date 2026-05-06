#!/bin/bash
set -e

VERSION=${1:-1.0.0}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
RPM_BUILD="$SCRIPT_DIR/rpmbuild"

rm -rf "$RPM_BUILD" && mkdir -p "$RPM_BUILD"/{BUILD,RPMS,SOURCES,SPECS,SRPMS} "$DIST_DIR"

mkdir -p "$RPM_BUILD/SOURCES/toneai-nux-$VERSION/usr/local/bin"
cp "$ROOT_DIR/toneai-nux-linux-x64" "$RPM_BUILD/SOURCES/toneai-nux-$VERSION/usr/local/bin/toneai-nux"
chmod +x "$RPM_BUILD/SOURCES/toneai-nux-$VERSION/usr/local/bin/toneai-nux"
cd "$RPM_BUILD/SOURCES" && tar czf "toneai-nux-$VERSION.tar.gz" "toneai-nux-$VERSION" && cd "$SCRIPT_DIR"

cat > "$RPM_BUILD/SPECS/toneai-nux.spec" << EOF
Name:           toneai-nux
Version:        $VERSION
Release:        1
Summary:        Setup wizard for ToneAI NUX MightyAmp tone assistant
License:        MIT
URL:            https://github.com/steve-krisjanovs/toneai-nux
Source0:        toneai-nux-%{version}.tar.gz

%description
ToneAI builds NUX MightyAmp presets from artist/song descriptions using AI.
This wizard downloads ToneAI and installs all required dependencies.

%prep
%setup -q -n toneai-nux-%{version}

%install
mkdir -p %{buildroot}/usr/local/bin
cp usr/local/bin/toneai-nux %{buildroot}/usr/local/bin/toneai-nux
chmod +x %{buildroot}/usr/local/bin/toneai-nux

%files
/usr/local/bin/toneai-nux

%changelog
* $(date '+%a %b %d %Y') Steve Krisjanovs <steve.krisjanovs@gmail.com> - $VERSION-1
- Release $VERSION
EOF

rpmbuild --define "_topdir $RPM_BUILD" -bb "$RPM_BUILD/SPECS/toneai-nux.spec"
cp "$RPM_BUILD/RPMS/x86_64/"*.rpm "$DIST_DIR/"
echo "Built: $DIST_DIR/toneai-nux-$VERSION-1.x86_64.rpm"
