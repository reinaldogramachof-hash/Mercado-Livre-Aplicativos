<?php
// router.php for PHP Built-in Server

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$fullpath = __DIR__ . $path;

// Se for um arquivo existente, serve ele
if (file_exists($fullpath) && !is_dir($fullpath)) {
    return false; // Serve file as-is
}

// Se for um diretório, procura por index.php ou index.html
if (is_dir($fullpath)) {
    if (file_exists($fullpath . '/index.php')) {
        include $fullpath . '/index.php';
        return true;
    }
    if (file_exists($fullpath . '/index.html')) {
        include $fullpath . '/index.html';
        return true;
    }
}

// 404
http_response_code(404);
echo "404 Not Found (Router): " . htmlspecialchars($path);
