# Personality Builder Replica - Windows launcher (no Python required)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "index.html"))) {
  Write-Host "No se encontro index.html en $Root" -ForegroundColor Red
  exit 1
}
Set-Location $Root

function Find-FreePort([int]$start = 8765) {
  $port = $start
  while ($port -lt ($start + 50)) {
    $inUse = $false
    try {
      $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
      if ($c) { $inUse = $true }
    } catch {
      try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
        $listener.Start()
        $listener.Stop()
      } catch {
        $inUse = $true
      }
    }
    if (-not $inUse) { return $port }
    $port++
  }
  return $start
}

$port = Find-FreePort 8765
$prefix = "http://127.0.0.1:$port/"
Write-Host ""
Write-Host " Personality Builder Replica" -ForegroundColor Yellow
Write-Host " Carpeta: $Root"
Write-Host " URL:     $prefix" -ForegroundColor Cyan
Write-Host " Ctrl+C para detener"
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Host "No se pudo abrir el puerto $port : $_" -ForegroundColor Red
  Write-Host "Abriendo index.html directamente..."
  Start-Process (Join-Path $Root "index.html")
  exit 1
}

Start-Process $prefix

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".d4"   = "application/xml; charset=utf-8"
  ".xml"  = "application/xml; charset=utf-8"
  ".gdtf" = "application/zip"
  ".mvr"  = "application/zip"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".map"  = "application/json"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $rel = $rel -replace "/", [IO.Path]::DirectorySeparatorChar
    $path = [IO.Path]::GetFullPath((Join-Path $Root $rel))
    if (-not $path.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $buf = [Text.Encoding]::UTF8.GetBytes("Forbidden")
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } elseif (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $res.StatusCode = 404
      $buf = [Text.Encoding]::UTF8.GetBytes("Not found: $rel")
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } else {
      $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      $bytes = [IO.File]::ReadAllBytes($path)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $res.StatusCode = 500
    $buf = [Text.Encoding]::UTF8.GetBytes("Error: $_")
    $res.OutputStream.Write($buf, 0, $buf.Length)
  } finally {
    $res.OutputStream.Close()
  }
}
