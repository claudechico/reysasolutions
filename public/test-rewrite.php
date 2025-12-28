<?php
// Test file to check if mod_rewrite is enabled
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "mod_rewrite is ENABLED";
    } else {
        echo "mod_rewrite is DISABLED";
    }
} else {
    echo "Cannot check modules. Try: phpinfo()";
}
phpinfo();
?>

