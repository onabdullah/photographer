<?php
$content = file_get_contents('bootstrap/app.php');
$target = "->withExceptions(function (Exceptions \$exceptions): void {";
$insert = "->withExceptions(function (Exceptions \$exceptions): void {
        \$exceptions->render(function (\Illuminate\Auth\AuthenticationException \$e, Request \$request) {
            if (\$request->is('shopify/*') && (\$request->hasHeader('X-Inertia') || \$request->wantsJson())) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
        \$exceptions->render(function (\Osiset\ShopifyApp\Exceptions\MissingShopDomainException \$e, Request \$request) {
            if (\$request->wantsJson() || \$request->hasHeader('X-Inertia')) {
                return response()->json(['message' => 'Missing shop domain.'], 401);
            }
        });";
$content = str_replace($target, $insert, $content);
file_put_contents('bootstrap/app.php', $content);
echo "Patched exceptions";
