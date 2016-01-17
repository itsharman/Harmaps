<?php

    require (__DIR__ . "/../includes/config.php");

    // numerically indexed array of places
    $places = [];

    // search database for places matching $_GET["geo"], store in $places
    // ie: if you look up cambridge, should give all results for cambridge
    // (Massachussets & England too)
    
    //search database for places matching $_GET["geo"]
    //MATCH -- much better matching than LIKE, http://stackoverflow.com/questions/792875/which-sql-query-is-better-match-against-or-like
    //IN BOOLEAN MODE -- used for correct searching, https://dev.mysql.com/doc/refman/5.5/en/fulltext-boolean.html
    //ORDER BY keyword -- used to sort the result-set by one or more columns, http://www.w3schools.com/sql/sql_orderby.asp
    $search = CS50::query ("SELECT * FROM places WHERE MATCH (place_name, postal_code, admin_name1, admin_code1) 
    AGAINST (? IN BOOLEAN MODE) 
    ORDER BY place_name;", $_GET["geo"]);
    
    //store matches in $places
    foreach ($search as $input) array_push ($places, $input);
    
    // dump($places);
    
    // output places as JSON (pretty-printed for debugging convenience)
    header("Content-type: application/json");
    print(json_encode($places, JSON_PRETTY_PRINT));
    
    //https://ide50-hs682.cs50.io/search.php?geo=New+Haven,Connecticut,US
    //https://ide50-hs682.cs50.io/search.php?geo=New+Haven,+Massachusetts
    //https://ide50-hs682.cs50.io/search.php?geo=New+Have,+MA
    //https://ide50-hs682.cs50.io/search.php?geo=New+Haven+MA
    //https://ide50-hs682.cs50.io/search.php?geo=06511

    //they all work as they should! :D

?>