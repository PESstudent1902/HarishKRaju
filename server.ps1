$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Try ports 8080, 8081, 8082 until one is free
$port = $null
foreach ($p in @(8080, 8081, 8082, 8083, 3000)) {
    $test = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
    $used = $test.GetActiveTcpListeners() | Where-Object { $_.Port -eq $p }
    if (-not $used) {
        $port = $p
        break
    }
}

if (-not $port) {
    Write-Host "  ERROR: Could not find a free port. Try closing other servers." -ForegroundColor Red
    pause
    exit 1
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "  ERROR: Could not start server on port $port" -ForegroundColor Red
    Write-Host "  Try running this script as Administrator." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

$url = "http://127.0.0.1:$port"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host "   Harish K Raju Portfolio -- Server Ready" -ForegroundColor White
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  URL  : $url" -ForegroundColor Green
Write-Host "  Root : $root" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Opening browser... Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

Start-Sleep 1
Start-Process $url

while ($listener.IsListening) {
    try {
        $ctx  = $listener.GetContext()
        try {
            $req  = $ctx.Request
            $res  = $ctx.Response

            $urlPath  = $req.Url.LocalPath.TrimStart('/')
            if ($urlPath -eq '') { $urlPath = 'index.html' }

            $fullPath = Join-Path $root $urlPath

            if (Test-Path $fullPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $ext   = [System.IO.Path]::GetExtension($fullPath).ToLower()

                $mime = switch ($ext) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.css'  { 'text/css' }
                    '.js'   { 'application/javascript' }
                    '.mp4'  { 'video/mp4' }
                    '.png'  { 'image/png' }
                    '.jpg'  { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.svg'  { 'image/svg+xml' }
                    '.ico'  { 'image/x-icon' }
                    default { 'application/octet-stream' }
                }

                $res.ContentType     = $mime
                $res.ContentLength64 = $bytes.Length
                $res.AddHeader("Access-Control-Allow-Origin", "*")
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "  [200] $urlPath" -ForegroundColor DarkGray
            }
            else {
                $res.StatusCode = 404
                Write-Host "  [404] $urlPath" -ForegroundColor DarkRed
            }

            $res.OutputStream.Close()
        }
        catch {
            # Log connection aborted or closed warnings, but don't stop the server
            Write-Host "  [WARN] Request aborted: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    catch {
        if (-not $listener.IsListening) {
            break
        }
    }
}

Write-Host ""
Write-Host "  Server stopped." -ForegroundColor Yellow
