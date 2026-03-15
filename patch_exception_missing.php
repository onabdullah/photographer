<?php
$content = file_get_contents('bootstrap/app.php');

$search = <<<EOT
                if (! \$shopDomainNative) {
                    return null;
                }
EOT;

$replace = <<<EOT
                if (! \$shopDomainNative) {
                    return new Response(
                        '<div style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>Session Expired</h2><p>Your session has expired or no shop domain was provided. Please relaunch the app from your Shopify Admin panel.</p></div>',
                        400,
                        ['Content-Type' => 'text/html']
                    );
                }
EOT;

$content = str_replace($search, $replace, $content);
file_put_contents('bootstrap/app.php', $content);
echo "Patched missing shop domain html";
