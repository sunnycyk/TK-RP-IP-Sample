let
  rev = "5d3fd3674a66c5b1ada63e2eace140519849c967";
  sha = "1yjn56jsczih4chjcll63a20v3nwv1jhl2rf6rk8d8cwvb10g0mk";

  nixpkgs = import (builtins.fetchTarball {
    name = "nixpkgs-pinned";
    url = "https://github.com/nixos/nixpkgs-channels/archive/${rev}.tar.gz";
    sha256 = sha;
  }) {};

in with nixpkgs; mkShell {
  buildInputs = [
    nodejs-10_x
  ];

  shellHook = ''
    export PATH="$(pwd)/node_modules/.bin:$(pwd)/bin:$PATH"
  '';
}
