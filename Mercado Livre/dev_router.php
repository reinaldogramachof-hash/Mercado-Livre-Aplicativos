<?php
// dev_router.php - Simple router for PHP built-in server to disable cache on static assets

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$ext = pathinfo($path, PATHINFO_EXTENSION);

// Extensions to handle manually to force no-cache headers
$static_exts = ['css', 'js', 'html', 'htm', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'json', 'woff', 'woff2', 'ttf', 'otf', 'txt', 'map'];

if (in_array(strtolower($ext), $static_exts)) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        // Minimal Mime types mapping
        $mimes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'html' => 'text/html',
            'htm' => 'text/html',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'json' => 'application/json',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'otf' => 'font/otf',
            'txt' => 'text/plain',
            'map' => 'application/json'
        ];

        $mime = $mimes[strtolower($ext)] ?? 'application/octet-stream';
        header("Content-Type: $mime");

        // NO CACHE HEADERS - The main goal
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");

        readfile($file);
        return true;
    }
}

// Let PHP handling (index.php, directories, or 404s for non-static)
return false;
?>