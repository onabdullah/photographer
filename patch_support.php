<?php
$file = 'app/Http/Controllers/SupportController.php';
$content = file_get_contents($file);

$content = str_replace(
"        \$conversation = LiveChatConversation::create([",
"        \Illuminate\Support\Facades\Log::info('SupportController store payload: ', \$request->all());

        if (strlen(\$request->input('message')) > 200) {
           \$preview = substr(\$request->input('message'), 0, 200);
        } else {
           \$preview = \$request->input('message');
        }

        \$conversation = LiveChatConversation::create([",
    $content
);

$content = str_replace(
"            'last_message_preview' => substr(\$request->input('message'), 0, 100),",
"            'last_message_preview' => \$preview,",
    $content
);

file_put_contents($file, $content);
