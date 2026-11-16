$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText((Join-Path $root 'index.html'), $utf8)

$texts = 0
$html = [regex]::Replace($html, '(<([a-zA-Z][\w-]*)\b[^<>]*?)\sdata-fr="([^"]*)"([^<>]*>)[^<]*(</\2>)', {
  param($m)
  $script:texts++
  $m.Groups[1].Value + $m.Groups[4].Value + $m.Groups[3].Value + $m.Groups[5].Value
})
$left = [regex]::Match($html, '<[^<>]*\sdata-fr="[^<>]*>')
if ($left.Success) { throw "This element has a data-fr attribute but contains other tags, so it cannot be translated: $($left.Value)" }

$attrs = 0
$html = [regex]::Replace($html, '<[a-zA-Z][\w-]*\b[^<>]*\sdata-fr-[^<>]*>', {
  param($m)
  $tag = $m.Value
  foreach ($a in [regex]::Matches($tag, '\sdata-fr-([\w-]+)="([^"]*)"')) {
    $name = $a.Groups[1].Value
    $pair = ' ' + $name + '="' + $a.Groups[2].Value + '"'
    $tag = $tag.Replace($a.Value, '')
    $existing = [regex]::Match($tag, '\s' + [regex]::Escape($name) + '="[^"]*"')
    if ($existing.Success) { $tag = $tag.Remove($existing.Index, $existing.Length).Insert($existing.Index, $pair) }
    else { $tag = $tag.Insert($tag.LastIndexOf('>'), $pair) }
    $script:attrs++
  }
  $tag
})

$links = 0
$html = [regex]::Replace($html, '\b(href|src|poster|data-full|data-other)="(?![a-zA-Z][a-zA-Z0-9+.-]*:|#|/|\.\./)([^"]*)"', {
  param($m)
  $script:links++
  $m.Groups[1].Value + '="../' + $m.Groups[2].Value + '"'
})

$dir = Join-Path $root 'fr'
if (-not (Test-Path $dir)) { New-Item -ItemType Directory $dir | Out-Null }
[IO.File]::WriteAllText((Join-Path $dir 'index.html'), $html, $utf8)
"fr/index.html written: $texts texts, $attrs attributes, $links links."
