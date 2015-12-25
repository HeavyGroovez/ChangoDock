var defaultBuildText = 'Enter Build Name...';
var xMouseCursorPosition;
var yMouseCursorPosition;

var currentGroupContainerX1;
var currentGroupContainerX2;
var currentGroupContainerY1;
var currentGroupContainerY2;

var currentItemContainerX1;
var currentItemContainerX2;
var currentItemContainerY1;
var currentItemContainerY2;

var modulePowerCheckboxClicked = false;
var modulePowerDivClicked = false;

var currentModuleBay = "";

var windowEdgeClearance = 100;
var updateNumber = 0;
var url;
var debug;


$.fn.setCursorPosition = function (pos) {
    this.each(function (index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } 
    });
    return this;
};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isInt(n)
{
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n)
{
    return n === Number(n) && n % 1 !== 0;
}

function Settings()
{
    this.CommanderName = "";
    this.SiriusDiscount = false;
    this.ShowModulePrices = false;
}

// Module Bay object
function ModuleBay ()
{
    this.ConfigID = 0;
    this.ModuleID = 0;
    this.PowerStatus = false;
}

// The BuildViewModel object containing the master build information and all model bindings for each module bay
function BuildViewModel () 
{
    this.CommanderName = "";
    this.ShipName= "";
    this.OriginalBuildName= "";
    this.NewBuildName = "";
    this.ModuleBays = [];
}

// Shield object
function Shield()
{
    this.shipBaseShield = 0;
    this.shipHullMass = 0;
    this.optMass = 0;
    this.minMass = 0;
    this.maxMass = 0;
    this.maxMultiplier = 0;
    this.minMultiplier = 0;
    this.optMultiplier = 0
    this.booster = 0;
}

Shield.prototype.calculateShieldStrength = function ()
{
    try
    {
        var mod;

        if (this.shipHullMass < this.minMass) {
            return this.shipBaseShield * this.booster * this.minMultiplier;
        }
        if (this.shipHullMass > this.maxMass) {
            return this.shipBaseShield * this.booster * this.maxMultiplier;
        }
        if (this.shipHullMass < this.optMass)
        {
            mod = (this.optMass - this.shipHullMass) / (this.optMass - this.minMass);
            mod = 1 - Math.pow(1 - mod, 0.87);
            return this.shipBaseShield * this.booster * ((mod * this.minMultiplier) + ((1 - mod) * this.optMultiplier));
        }
        else
        {
            mod = (this.optMass - this.shipHullMass) / (this.maxMass - this.optMass);
            mod = -1 + Math.pow(1 + mod, 2.425);
            return this.shipBaseShield * this.booster * ((-1 * mod * this.maxMultiplier) + ((1 + mod) * this.optMultiplier));
        }
    }
    catch (ex)
    {
        return 0;
    }
}

// Frameshift Drive object
function FrameShiftDrive ()
{
    this.maxFuel = 0;
    this.fuelMultiplier = 0;
    this.optimalMass = 0;
    this.fuelPower = 0;
    this.shipMass = 0;
    this.fuel = 0;
}

FrameShiftDrive.prototype.calculateJumpRange = function ()
{
    var range = 0;

    // Use max fuel from FSD 
    if (this.fuel == 0)
    {
        range = Math.pow(this.maxFuel / this.fuelMultiplier, 1 / this.fuelPower) * this.optimalMass / this.shipMass;
    }
    // Only a splash of gas in the tank
    else 
    { 
        range = Math.pow(this.fuel / this.fuelMultiplier, 1 / this.fuelPower) * this.optimalMass / this.shipMass;
    }
    return range.toFixed(2);
}

// Ship object
function Ship()
{
    // Public properties 
    mass: 0;
    baseSpeed: 0;
    baseBoost: 0;
    thrusters: 0; 

    var _ship; // Pointer to the Ship object for the privately scoped methods

    // Private speed calculation method
    function calculateSpeed(type) {
        var ship = _ship;
        var thrusters = ship.thrusters;
        var base = type === 'boost' ? ship.baseBoost : ship.baseSpeed;
        var multiplier =  ship.mass > thrusters.maxMass ? 0 : ((1 - thrusters.M) + (thrusters.M * Math.pow(3 - (2 * Math.max(0.5, ship.mass / thrusters.optMass)), thrusters.P)));
        return base * multiplier;
    }

 
    // Public method to calculate boost speed
    this.calculateBoostSpeed = function () {
        _ship = this;
        return calculateSpeed('boost');
    }

    // Public method to calculate non boost speed
    this.calculateNonBoostSpeed =  function () {
        _ship = this;
        return calculateSpeed('nonboost');
    }


}

// Thrusters object constructor
function Thrusters()
{
    // Public properties
    optMass: 0;
    minMass: 0;
    maxMass: 0;
    M: 0;
    P: 0;
}

function calculateSpeedMetrics()
{
    // Unladen ship mass
    var shipMassUnladen = parseFloat($('#ShipMassUnladen').data('mass'));

    // Total fuel mass
    var shipFuelMass = parseFloat($('#ShipFuelMass').data('mass'));

    // Get the thrusters element
    var thrusterAttribs = $('[data-m]');
    
    // Create the thrusters object
    var thrusters = new Thrusters();
    thrusters.optMass = thrusterAttribs.data('optmass');
    thrusters.maxMass = thrusterAttribs.data('maxmass');
    thrusters.minMass = thrusterAttribs.data('minmass');
    thrusters.M = thrusterAttribs.data('m');
    thrusters.P = thrusterAttribs.data('p');

    // Create ship object
    var ship = new Ship();
    ship.mass = shipMassUnladen + shipFuelMass;
    ship.baseBoost = $('#OutfittingTitle').data('shipbaseboost');
    ship.baseSpeed = $('#OutfittingTitle').data('shipbasespeed');
    ship.thrusters = thrusters;

    // Calculate and render
    $('#ShipBoostSpeed').text(ship.calculateBoostSpeed().toFixed(0) + ' M/S');
    $('#ShipNonBoostSpeed').text(ship.calculateNonBoostSpeed().toFixed(0) + ' M/S');
}


function calculateJumpMetrics()
{
    
    var maxJumpRange = 0;
    var maxJumpRangeLaden = 0;
    var maxJumpRangeUnladen = 0;
    var maxJumps = 0;
    var totalRangeUnladen = 0;
    var totalRangeLaden = 0;
    var shipMassUnladen = parseFloat($('#ShipMassUnladen').data('mass'));
    var shipMassLaden = parseFloat($('#ShipMassLaden').data('mass'));
    var fuelRemaining  = 0;
    var jumps = 0;
    var lastJumpFuel = 0;

    // Create new instance of the FSD
    var fsd = new FrameShiftDrive();
    
    // Get the frame shift drive element
    var fsdAttribs = $('[data-maxfuel]');

    // Total fuel
    var shipFuelMass = parseFloat($('#ShipFuelMass').data('mass'));

    // Set the FSD properties
    fsd.fuelMultiplier = fsdAttribs.data('fuelmultiplier');
    fsd.fuelPower = fsdAttribs.data('fuelpower');
    fsd.maxFuel = fsdAttribs.data('maxfuel');
    fsd.optimalMass = fsdAttribs.data('optimalmass');  

    // Calculate max jump range with no cargo and 1 jumps worth of gas
    fsd.shipMass = shipMassUnladen + fsd.maxFuel;
    maxJumpRange = fsd.calculateJumpRange();

    // Calculate max jump range with no cargo and a full tank of gas
    fsd.shipMass = shipMassUnladen + shipFuelMass;
    maxJumpRangeUnladen = fsd.calculateJumpRange();

    // Calculate max jump range with cargo and a full tank of gas
    fsd.shipMass = shipMassLaden;
    maxJumpRangeLaden = fsd.calculateJumpRange();

    // Calculate max jumps
    if (shipFuelMass % fsd.maxFuel == 0) 
    {
        maxJumps = shipFuelMass / fsd.maxFuel;
        lastJumpFuel = fsd.maxFuel;
    }
    else
    {
        maxJumps = (Math.floor(shipFuelMass / fsd.maxFuel)) + 1;
        lastJumpFuel = shipFuelMass % fsd.maxFuel;   
    }

    
    // Calculate unladen total jump range

    // Last jump
    fuelRemaining = lastJumpFuel;
    fsd.shipMass = shipMassUnladen + lastJumpFuel;
    fsd.fuel = lastJumpFuel;
    totalRangeUnladen = parseFloat(fsd.calculateJumpRange());
    fuelRemaining += fsd.maxFuel;

    // For each max fuel jump, calculate the max jump range based on fuel mass left in the tank
    for (var j = 1; j <= maxJumps - 1; j++) {
        fsd.shipMass = shipMassUnladen + fuelRemaining // ship mass for jump
        fsd.fuel = fsd.maxFuel; // using max fuel for each jump
        totalRangeUnladen += parseFloat(fsd.calculateJumpRange());
        fuelRemaining += fsd.maxFuel; 
    }

    // Calculate Laden total jump range
        
    // Last jump
    shipMassLaden -= shipFuelMass; // shipMassLaden includes all fuel - subtract total fuel from total
    fuelRemaining = lastJumpFuel;
    fsd.shipMass = shipMassLaden + lastJumpFuel;
    fsd.fuel = lastJumpFuel;
    totalRangeLaden = parseFloat(fsd.calculateJumpRange());
    fuelRemaining += fsd.maxFuel;

    // For each max fuel jump, calculate the max jump range based on fuel mass left in the tank
    for (var j = 1; j <= maxJumps - 1; j++) {
        fsd.shipMass = shipMassLaden + fuelRemaining // ship mass for jump
        fsd.fuel = fsd.maxFuel; // using max fuel for each jump
        totalRangeLaden += parseFloat(fsd.calculateJumpRange());
        fuelRemaining += fsd.maxFuel;
    }


    // Render
    $('#ShipJumpRangeMax').text(maxJumpRange + ' LY');
    $('#ShipJumpRangeFullTank').text(maxJumpRangeUnladen + ' LY');
    $('#ShipJumpRangeLaden').text(maxJumpRangeLaden + ' LY');
    $('#ShipTotalRangeJumps').text(maxJumps);
    $('#ShipTotalRangeUnladen').text(totalRangeUnladen.toFixed(2) + 'LY');
    $('#ShipTotalRangeLaden').text(totalRangeLaden.toFixed(2) + ' LY');
}

function calculateShieldMetrics()
{
    $(function()
    {
        // Create a new instance of the shield object
        var shield = new Shield();

        // Get the shield generator if one exists
        var shieldGenAttribs = $('[data-optmultiplier]');

        // Get the base ship attribs
        var shieldBaseAttribs = $('[data-shipbaseshields]');

        var totalBoost = 0;

        // If we have a shield generator setup the shield object and calculate
        if (shieldGenAttribs.length > 0)
        {
            shield.shipBaseShield = shieldBaseAttribs.data("shipbaseshields");
            shield.shipHullMass = shieldBaseAttribs.data("shiphullmass");
            shield.maxMass = shieldGenAttribs.data("maxmass");
            shield.minMass = shieldGenAttribs.data("minmass");
            shield.maxMultiplier = shieldGenAttribs.data("maxmultiplier");
            shield.minMultiplier = shieldGenAttribs.data("minmultiplier");
            shield.optMass = shieldGenAttribs.data("optmass");
            shield.optMultiplier = shieldGenAttribs.data("optmultiplier");

            // Get total boosters modifier
            $('[data-booster]').each
                (
                    function () {
                        if ($(this).text() != "")
                        {
                            // Is the booster enabled ?
                            if ($('#ModulePowerCheckbox' + $(this).data('configid')).prop('checked') == true) {
                                totalBoost += $(this).data('booster')
                            }
                        }
                    }
                )
          
            if (isNaN(totalBoost))
            {
                shield.booster = 1;
            }
            else
            {
                shield.booster = 1 + (totalBoost / 100);
            }

            // Calculate total shield strength
            var finalShieldStrength = shield.calculateShieldStrength();

            // Render
            if (isNaN(finalShieldStrength))
            {
                $('#ShipShieldStrength').text('NO SHIELD')
            }
            else
            {
                $('#ShipShieldStrength').text(finalShieldStrength.toFixed(0) + ' MJ')
            }
        }
        else
        {
            $('#ShipShieldStrength').text('NO SHIELD')
        }
    })
}

function calculateArmourMetrics() {
    $(function () {
        
        // Base armor
        var totalArmour =  $('#OutfittingTitle').data('shipbasearmour');
        var bulkheadsBaseModifier = 0;

        // Bulkheads
        bulkheads = $('[id^=ModuleDescription]').each(
            function ()
            {
                if ($(this).data('attributes') == "Reinforced Alloy")
                {
                    bulkheadsBaseModifier = .4;
                }
                else if ($(this).data('attributes') == "Military Grade Composite" || $(this).data('attributes') == "Mirrored Surface Composite" || $(this).data('attributes') == "Reactive Surface Composite")
                {
                    bulkheadsBaseModifier = .95;
                }
            })

        totalArmour += totalArmour * bulkheadsBaseModifier;

        // Enumerate hull reinforcement packages
        $('[data-armour]').each(function () {
            if ($(this).data('armour') !="")
            {
                totalArmour += parseFloat($(this).data('armour'));
            }
            
        })

        // Render
        $('#ShipArmourStrength').text(Math.round(totalArmour));
    })
}

function calculatePriceMetrics()
{
    $(function ()
    {
        var hullPrice = 0;
        var totalPrice = 0;
        var rebuy = 0;
        var siriusDiscount = $('#SiriusDiscount').prop('checked');

        // Enumerate all the ModuleDescription containers and add prices 
        $('[id^=ModuleDescription]').each
        (
            function ()
            {
                if ($(this).data('price') != "") 
                {
                    totalPrice += parseFloat($(this).data('price'));
                }
            }
         );

        // Ship hull price
        hullPrice = parseFloat($('#OutfittingTitle').data('hullprice'));
        totalPrice += hullPrice;

        // 15% Discount
        if (siriusDiscount) {
            totalPrice = totalPrice * 0.85;
        }

        // Rebuy is 5% - Beta is a 96.25% reduction of the 5%
        rebuy = (totalPrice * 0.0375);

        // Render
        $('#PriceMetricsTotalText').text(numberWithCommas(totalPrice.toFixed(0)));
        $('#PriceMetricsRebuyText').text(numberWithCommas(rebuy.toFixed(0)));
    });
}

function calculatePowerMetrics()
{
    var unit = ' MW';
    var totalPower = 0;
    var consumedPower = 0;
    var availablePower = 0;

    // Calculate the consumed and available power 
    $(function ()
    {
        totalPower = parseFloat($('#Power').data('power')).toFixed(2);

        // Enumerate all the ModulePowerText spans and add any checked values to consumption total
        $('[id^=ModulePowerText]').each(
            function () 
            {
                if ($(this).text() != "")
                {
                    // We have a module with power draw - is the checkbox checked ?
                    if ($('#ModulePowerCheckbox' + $(this).data('configid')).prop('checked') == true)
                    {
                        consumedPower += parseFloat($(this).text());
                    }
                }
            });
    
        // Cargo Hatch
        if ($('#ModulePowerCheckboxCargoHatch').prop('checked') == true)
        {
            consumedPower += parseFloat($('#ModulePowerCargoHatch').text());
        }

        availablePower = totalPower - consumedPower;
    
        // Update the total, consumed and available power text
        $('#PowerMetricsTotalText').text(totalPower.toString() + unit)
        $('#PowerMetricsConsumedText').text(consumedPower.toFixed(2) + unit)
        $('#PowerMetricsAvailableText').text(availablePower.toFixed(2) + unit)
        if (availablePower > 0)
        {
            $('#PowerMetricsAvailableText').addClass('powerMetricsGoodHighlight')
            $('#PowerMetricsAvailableText').removeClass('powerMetricsBadHighlight')
        }
        else
        {
            $('#PowerMetricsAvailableText').removeClass('powerMetricsGoodHighlight')
            $('#PowerMetricsAvailableText').addClass('powerMetricsBadHighlight')
        }
              
    })
}

    function calculateMassMetrics() {

        var shipHullMass = $('#OutfittingTitle').data('shiphullmass'); // Get ship base mass
        var componentMass = 0; // components != Cargo Rack || Fuel Tank
        var unladenMass = 0; // shipHullMass + componentMass 
        var ladenMass = 0; // shipHullMass + componentMass + fuelMass + cargoMass
        var fuelMass = 0; // components == Fuel Tank
        var cargoMass = 0; // components == Cargo Rack

        // Enumerate all module mass containers and add the mass to the correct total
        $('[id^=ModuleMass]').each(
            function()
            {
                if ($(this).data('moduletype') == 'Cargo Rack') {
                    cargoMass += $(this).data('mass');
                }
                else if ($(this).data('moduletype') == 'Fuel Tank') {
                    fuelMass += $(this).data('mass');
                }
                else
                {
                    if (!isNaN($(this).data('mass')))
                    {
                        componentMass += parseFloat($(this).data('mass'));
                    }
                }
            }
        )

        // Calculate all mass totals
        unladenMass = shipHullMass + componentMass;
        ladenMass = shipHullMass + componentMass + fuelMass + cargoMass;

        // Render
        if (!isFloat(unladenMass))
        {
            $('#ShipMassUnladen').text(unladenMass + ' T').data('mass', unladenMass);
        }
        else
        {
            $('#ShipMassUnladen').text(unladenMass.toFixed(2) + ' T').data('mass', unladenMass.toFixed(2));
        }
        
        if (!isFloat(ladenMass)) {
            $('#ShipMassLaden').text(ladenMass + ' T').data('mass', ladenMass);
        }
        else
        {
            $('#ShipMassLaden').text(ladenMass.toFixed(2) + ' T').data('mass', ladenMass.toFixed(2));
        }
    
        $('#ShipCargoMass').text(cargoMass + ' T').data('mass', cargoMass);
        $('#ShipFuelMass').text(fuelMass + ' T').data('mass', fuelMass);
    }

    function hideSelectors() {

        var debugText;
        hide = false;

        // We need to adjust the X value of the mouse so that it maps to X=0 when it is at the left edge of the framework container
        xMouseCursorPosition -= Math.round($('#FrameworkContainer').offset().left);

        debugText = "xMouse=" + xMouseCursorPosition + ";yMouse=" + yMouseCursorPosition;

        if (xMouseCursorPosition > currentGroupContainerX2)
        {
            debugText += ";MouseX > X2=" + currentGroupContainerX2;
            hide = true;
        }
        else if (xMouseCursorPosition < currentGroupContainerX1)
        {
            debugText += ";MouseX < X1= " + currentGroupContainerX1;
            hide = true;
        }
        else if (yMouseCursorPosition < currentGroupContainerY1)
        {
            debugText += ";MouseY < Y1=" + currentGroupContainerY1;
            hide = true;
        }
        else if (yMouseCursorPosition > currentGroupContainerY2)
        {
            debugText += ";MouseY > Y2=" + currentGroupContainerY2;
            hide = true;
        }


        if (hide)
        {
            $('#DebugDiv').text(debugText);
            $("#ModuleSelectorGroupPanel").css({ visibility: "hidden" });
            $("#ModuleSelectorItemPanel").css({ visibility: "hidden" });
            $('#SettingsPanel').css({ visibility: "hidden" });
            $('#HangarPanel').css({ visibility: "hidden" });
            $('[id^=ModuleClass]').removeClass('focusHighlight');
            removeOffsets();
        }
    
    }

    function removeOffsets()
    {
        $("#ModuleSelectorItemPanel").removeClass("moduleSelectorItemPanelWeaponOffset");
        $("#ModuleSelectorItemPanel").removeClass("moduleSelectorItemPanelBulkheadsOffset");
        $("#ModuleSelectorItemPanel").removeClass("moduleSelectorItemPanelExplorationScannerOffset");
    }

    function bindModuleSelectorGroupEventHandlers()
    {
        $("[id^=ModuleSelectorTypeContainer]").click(function ()
        {
            displayModuleSelectorItem($(this).attr("id"));
        });
    }

    function bindModuleSelectorItemEventHandlers()
    {
        $("[id^=ModuleSelectorItemContainer]").click(function () { displayModule($(this).data("moduleid")); }).mousemove(function () { displayPrice($(this).data("price")) })
        .mouseleave(function () { displayPrice("")});
    }

    function bindModuleSelectorWeaponEventHandlers()
    {
        $("[id^=ModuleSelectorWeaponContainer]").click(function () { displayModule($(this).data("moduleid")); }).mousemove(function () { displayPrice($(this).data("price"))})
        .mouseleave(function (){displayPrice("")});
    }

    function displayPrice(price) {
        $(function ()
        {
            if (price != "") {
                if ($('#SiriusDiscount').prop('checked')) {price = price * 0.85;}
                $('#ModulePriceLabel').text(numberWithCommas(price.toFixed(0)))
            }
            else { $('#ModulePriceLabel').text(''); }
        });
    }

    function displayModule(moduleID)
    {
        // AJAX call to get the _Module partial view to render the current module bay div with the selected module
        $(function () {
            $('#DebugDiv').text(moduleID);

            var shipName = $(currentModuleBay).data('ship');
            var configID = $(currentModuleBay).data('configid')
            var moduleClass = $(currentModuleBay).data('moduleclass')
            var section = $(currentModuleBay).data('section')
            var powerStatus = $(currentModuleBay).data('powerstatus')

            $.get(moduleUrl, {
                shipName: shipName,
                configID: configID,
                moduleID: moduleID,
                moduleClass: moduleClass,
                section: section,
                powerStatus: powerStatus
            },
                function (data) 
                {
                    $(currentModuleBay).html(data);
                    $('#ModulePowerCheckbox' + configID).prop('checked', true); // Default power status to on (override the saved build bay value)
                    calculatePowerMetrics();
                    calculateShieldMetrics();
                    calculateMassMetrics();
                    calculateJumpMetrics();
                    calculatePriceMetrics();
                    calculateArmourMetrics();
                    calculateSpeedMetrics();
                })

        });
    }

    function bindEventHandlers()
    {
        $(function ()
        {
            bindBuildTextFocusEventHandlers();
            bindMouseEventHandlers();
            bindBodyEventHandlers();
            bindModuleSelectorEventHandlers();
            bindModuleSelectorWeaponEventHandlers();
            bindPowerCheckboxEventHandlers();
            bindBuildTextEventHandlers();
            bindButtonSaveEventHandlers();
            bindButtonDeleteEventHandlers();
            bindButtonReloadEventHandlers();
            bindButtonCopyEventHandlers();
            bindSettingsEventHandlers();
            bindHangerEventHandlers();
            bindPowerDivEventHandlers();
            setupToolbar();
        })
    }

    function bindBuildTextFocusEventHandlers() {
        $(function () {
            window.setTimeout(function () {
                $('#BuildText').focus(function () {
                    if ($('#BuildText').val() === defaultBuildText) {
                        $('#BuildText').setCursorPosition(0);
                    }
                });
            }, 10);
        });
    }

    function bindHangerEventHandlers()
    {
        $(function () {
            $('#NavbarHangarLink').click(function () {
                displayHangar();
            });
        });
    }

        function displayHangar()
        {
            // Define location metrics
            var hangarPanel = '#HangarPanel';
            var hangarLink = '#NavbarHangarLink'
            var hangarPanelLeft;
            var hangarPanelTop;
            var frameworkContainerLeft;
        
            $("#ModuleSelectorGroupPanel").css({ visibility: "hidden" });
            $("#ModuleSelectorItemPanel").css({ visibility: "hidden" });
            $('#SettingsPanel').css({ visibility: "hidden" });

            frameworkContainerLeft = Math.round($('#FrameworkContainer').offset().left);

            hangarPanelLeft = Math.round($(hangarLink).offset().left) - frameworkContainerLeft;
            hangarPanelTop = Math.round($(hangarLink).offset().top) + Math.round($(hangarLink).outerHeight());

            currentGroupContainerX1 = hangarPanelLeft;
            currentGroupContainerX2 = currentGroupContainerX1 + $(hangarPanel).outerWidth();
            currentGroupContainerY1 = $(hangarLink).offset().top;
            currentGroupContainerY2 = currentGroupContainerY1 + $(hangarLink).outerHeight() + $(hangarPanel).outerHeight();

            // AJAX get to load ship builds for this commander
            $.get(hangarUrl, { commanderName: 'System' }, function (data){
                $(hangarPanel).html(data);
            });

            // Render
            $('#HangarPanel').css({ visibility: 'visible', left: hangarPanelLeft, top: hangarPanelTop });
        }

        function bindSettingsEventHandlers()
        {
            $(function () {
                $('#NavbarSettingsLink').click
                    (function () {
                        displaySettings();
                    });
                $('#SiriusDiscount').click
                    (function () {
                        saveSettings();
                    });
                $('#ShowModulePrices').click
                    (function () {
                        saveSettings();
                    });
            });
        }

        function saveSettings() {

            $(function()
            {
                var siriusDiscount = $('#SiriusDiscount').prop('checked');
                var showModulePrices = $('#ShowModulePrices').prop('checked');

                // Async AJAX Call to save the settings for this commander
                $.ajax({
                    url: saveSettingsUrl,
                    async: false,
                    type: "POST",
                    data: { commanderName: "System", siriusDiscount: siriusDiscount, showModulePrices: showModulePrices},  // data to server
                    dataType: "html", // type of data from server
                    error: function (jqXHR, textStatus, errorThrown) {
                        alert(jqXHR + "-" + textStatus + "-" + errorThrown);
                    },
                    success: function (data) 
                    {
                        $('#Result').html(data);
                        if ($('#ResultText').data('message') != "") {
                            alert($('#ResultText').data('message'));

                        }
                        else {
                            calculatePriceMetrics();
                        }
                    }
                });
            });
        }

        function displaySettings()
        {
            $(function ()
            {
                var settingsPanel = '#SettingsPanel';
                var settingsLink = '#NavbarSettingsLink'
                var settingsPanelLeft;
                var settingsPanelTop;
                var frameworkContainerLeft;

                $("#ModuleSelectorGroupPanel").css({ visibility: "hidden" });
                $("#ModuleSelectorItemPanel").css({ visibility: "hidden" });
                $('#HangarPanel').css({ visibility: "hidden" });

                frameworkContainerLeft = Math.round($('#FrameworkContainer').offset().left);

                settingsPanelLeft = Math.round($(settingsLink).offset().left) - frameworkContainerLeft;
                settingsPanelTop = Math.round($(settingsLink).offset().top) + Math.round($(settingsLink).outerHeight());
       
                currentGroupContainerX1 = settingsPanelLeft;
                currentGroupContainerX2 = currentGroupContainerX1 + $(settingsPanel).outerWidth();
                currentGroupContainerY1 = $(settingsLink).offset().top;
                currentGroupContainerY2 = currentGroupContainerY1 + $(settingsLink).outerHeight() + $(settingsPanel).outerHeight();

                // Render       
                $(settingsPanel).css({ visibility: "visible" });
                $(settingsPanel).css({ left: settingsPanelLeft });
                $(settingsPanel).css({ top: settingsPanelTop });
            })
        }

        function loadSettings() {

            // AJAX Call to load the settings for this commander
            $.ajax({
                url: loadSettingsUrl,
                async: false,
                type: "POST",
                data: { commanderName: "System" },  // data to server
                dataType: "json", // type of data from server
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(jqXHR + "-" + textStatus + "-" + errorThrown);
                },
                success: function (data) {
                    var result = new Settings();
                    result = data;
                    $('#SiriusDiscount').prop('checked', result.SiriusDiscount);
                    $('#ShowModulePrices').prop('checked', result.ShowModulePrices);
                }
            });
        }

        function bindBuildTextEventHandlers()
        {
            $('#BuildText').keypress(
                function ()
                {
                    if ($(this).val() == "Enter Build Name..." || $('#BuildText').val() == "Invalid Build Name...")
                    {
                        $(this).val('');
                    }
                }
            )

        }

        function bindButtonSaveEventHandlers()
        {
            $('#ButtonSave').click(
               function () {
                   if ($('#BuildText').val() == "" || $('#BuildText').val() == "Enter Build Name..." || $('#BuildText').val() == "Invalid Build Name..." || $('#BuildText').val() == "Default")
                   {
                       alert("Invalid Build Name");
                   }
                   else
                   {
                       saveBuildJson();
                   }
               }
           )
        }

        function bindButtonReloadEventHandlers()
        {
            $(function ()
            {
                $('#ButtonReload').click(
                    function ()
                    {
                        location.reload();
                    }
                );
            });
        }

        function bindButtonDeleteEventHandlers() {
            $('#ButtonDelete').click(
               function () {
                   if ($('#BuildText').val() == "Enter Build Name..." )
                   {
                       alert("Cannot Delete Default Build.");
                   }
                   else
                   {
                       deleteBuild();
                   }
               }
           )
        }

        function bindButtonCopyEventHandlers() {
            $(function () {
                $('#ButtonCopy').click(function () {
                    copyBuild();
                });
            });
        }

        function copyBuild() {
            $(function () {
                // Set the original build name to Default to emulate a new build with the current module bay bindings
                $('#OutfittingTitle').data('buildname', 'Default');
                $('#BuildText').val('Enter Build Name...');
                $('#BuildText').focus();
                setCaretPosition('BuildText', 0);
            });
        }

        function setupToolbar()
        {
            $('#Toolbar').css({ visibility: "visible" });
            if ($('#OutfittingTitle').data('buildname') != 'Default')
            { 
                $('#BuildText').val($('#OutfittingTitle').data('buildname'));
            }
        }

        function bindMouseEventHandlers() 
        {
            $(function () {
                // Hook mousemove  
                $(document).mousemove(
                    function (e) {

                        xMouseCursorPosition = e.pageX;
                        yMouseCursorPosition = e.pageY;

                        debugText = "X=" + xMouseCursorPosition + ";Y=" + yMouseCursorPosition;
                        debugText += ";X2=" + currentGroupContainerX2;
                        debugText += ";X1= " + currentGroupContainerX1;
                        debugText += ";Y1=" + currentGroupContainerY1;
                        debugText += ";Y2=" + currentGroupContainerY2;

                        $('#DebugDiv').text(debugText);
                    })
            });
        }

        function bindBodyEventHandlers()
        {
            $(function () {
                $(document).click(
                    function ()
                    {
                        hideSelectors();
                    })
            });
        }

        function bindModuleSelectorEventHandlers() {
            // Enumerate all module bays and add click handler for module selector
            $("[id^=ModuleContainer]").click(
                function ()
                {
                    // Set the current module bay
                    currentModuleBay = '#' + $(this).attr("id");

                    // Bind the click event
                    if ($(this).data("section") == "Standard")
                    {
                        displayModuleSelectorItem($(this).attr("id"));
                    }
                    else
                    {
                        displayModuleSelectorGroup($(this).attr("id"));
                    }
                });
        }

        function bindPowerCheckboxEventHandlers()
        {
            // Enumerate all Power Checkboxes and add click handler
            $("[id^=ModulePowerCheckbox]").click(
                function ()
                {
                    modulePowerCheckboxClicked = true;
                    calculatePowerMetrics();
                    calculateShieldMetrics();
                });
        }

        function bindPowerDivEventHandlers()
        {
            // Enumerate all power divs and add click handler
            $('[id^=ModulePowerContainer').click(
                function ()
                {
                    modulePowerDivClicked = true;
                });
            
        }

        function powerRegionClicked()
        {

            if (modulePowerCheckboxClicked || modulePowerDivClicked) {
                modulePowerDivClicked = false;
                modulePowerCheckboxClicked = false;
                return true;
            }
            else
            {
                return false;
            }

        }

        function displayModuleSelectorItem(sender)
        {
            $(function ()
            {
                var frameworkContainerLeft;
                var selectedParentLeft;
                var selectedParentTop;
                var selectedParentBorder;
                var standardBorder = 2;
                var selectedParent = '#' + sender;
                var moduleClassID = '#ModuleClass' + $(selectedParent).data('configid');
                var moduleSelector = '#ModuleSelectorItemPanel'

                // Do not render if the event was bubbled up from a Power Checkbox click event
                if (powerRegionClicked()) { return; }

                // Do not render for Cargo Hatch
                if ($(selectedParent).data('moduletype') == "Cargo Hatch") {
                    // Blag the hide selectors function and run the module bay render
                    currentGroupContainerX1 = $(window).width();
                    return;
                }

                // If the module type is EMPTY immediately execute module bay render
                if ($(selectedParent).data('moduletype') == "Empty")
                {
                    // Blag the hide selectors function and run the module bay render
                    currentGroupContainerX1 = $(window).width();
                    displayModule(1);
                    return;
                }

                // For utilities we have Chaff Launcher/Point Defence/ECM/Heatsink Launcher groups that only contain one item and do not need an item dropdown
                if ($(selectedParent).data('moduletype') == "Chaff Launcher" || $(selectedParent).data('moduletype') == "Point Defence" ||
                    $(selectedParent).data('moduletype') == "Heat Sink Launcher" || $(selectedParent).data('moduletype') == "Electronic Countermeasure")
                {
                    // Blag the hideSelectors function and run the module bay render
                    currentGroupContainerX1 = $(window).width();
                    displayModule($(selectedParent).data('moduleid'));
                    return;
                }     

                // AJAX call to populate module item selector with data based on current module group selection and render it
                $.get(itemUrl, {
                    configID: $(selectedParent).data('configid'),
                    shipName: $(selectedParent).data('ship'),
                    sectionName: $(selectedParent).data('section'),
                    moduleClass: $(selectedParent).data('moduleclass'),
                    moduleType: $(selectedParent).data('moduletype')
                },
                    function (data) {
                        $(moduleSelector).html(data);

                        frameworkContainerLeft = Math.round($('#FrameworkContainer').offset().left);
                        selectedParentLeft = Math.round($(selectedParent).offset().left) - frameworkContainerLeft;
                        selectedParentTop = Math.round($(selectedParent).offset().top);
                        selectedParentBorder = standardBorder;
               
                        currentItemContainerX1 = selectedParentLeft + $(selectedParent).outerWidth();
                        currentItemContainerX2 = currentItemContainerX1 + $(moduleSelector).outerWidth();
                        currentItemContainerY1 = selectedParentTop + $(selectedParent).outerHeight();
                        currentItemContainerY2 = currentItemContainerY1 + $(moduleSelector).outerHeight();

                        // If the parent is not a group selector these values will not have been set
                        if (selectedParent.indexOf('ModuleContainer', 1) > 0) {
                            currentGroupContainerX1 = currentItemContainerX1;
                            currentGroupContainerX2 = currentItemContainerX2;
                            currentGroupContainerY1 = currentItemContainerY1;
                            currentGroupContainerY2 = currentItemContainerY2;
                        }

                        // Render the drop down within the viewport boundary. Either drop it down or pop it up from the module bay origin.
                        // Overlap the border of the module group and the selector using the selectGroupBorder offset.
                        if (currentItemContainerY2 > $(window).height() - windowEdgeClearance) {
                            $(moduleSelector).css({ top: selectedParentTop - $(moduleSelector).outerHeight() });
                        }
                        else
                        {
                            // If the parent is a standard module bay we have skipped the group selector phase. 
                            // Position the item selector relative to the parent module container
                            if (selectedParent.indexOf('ModuleContainer', 1) > 0)
                            {
                                $(moduleSelector).css({ top: selectedParentTop + $(selectedParent).outerHeight() - selectedParentBorder });
                            }
                            else // Position relative to group selector
                            {
                                $(moduleSelector).css({ top: selectedParentTop - selectedParentBorder });
                            }
                        }

                        // Perfrom the same operation in the X Axis
                        if (currentItemContainerX2 + $(moduleSelector).outerWidth() > $(window).width()) {
                            $(moduleSelector).css({ left: selectedParentLeft - $(moduleSelector).outerWidth() });
                        }
                        else
                        {
                            // If the parent is a standard module bay we have skipped the group selector phase. 
                            // Position the item selector relative to the parent module container
                            if (selectedParent.indexOf('ModuleContainer', 1) > 0)
                            {
                                $(moduleSelector).css({ left: selectedParentLeft });
                            }
                            else
                            {
                                $(moduleSelector).css({ left: selectedParentLeft + $(selectedParent).outerWidth() });
                            }
                        }

                        // Enumerate all weapon selector containers and add hover highlight
                        $("[id^=ModuleSelectorWeaponContainer]").hover(
                                function () {

                                    // Get the contained weapon mount div using the id data attribute from the parent
                                    weaponMount = '#WeaponMount' + $(this).data('moduleid')

                                    // Extract weapon mount type from attribute
                                    var hoverWeaponGraphic = "weaponMountFocus" + $(weaponMount).data('weaponmount');

                                    $(weaponMount).addClass(hoverWeaponGraphic);
                                },
                                function () {

                                    // Get the contained weapon mount div using the id data attribute from the parent
                                    weaponMount = '#WeaponMount' + $(this).data('moduleid');

                                    // Extract weapon mount type from attribute
                                    var hoverWeaponGraphic = "weaponMountFocus" + $(weaponMount).data('weaponmount');

                                    $(weaponMount).removeClass(hoverWeaponGraphic);
                                }
                        );

                        // Remove any existing offsets
                        removeOffsets();

                        // If its a hardpoint we need to adjust the width of the panel 
                        if ($(selectedParent).data('section') == "Hardpoint")
                        {
                            $(moduleSelector).addClass("moduleSelectorItemPanelWeaponOffset");
                        }

                        // If its a bulkhead we need to adjust the width of the panel
                        if ($(selectedParent).data('moduletype') == "Bulkheads") {
                            $(moduleSelector).addClass("moduleSelectorItemPanelBulkheadsOffset");
                        }

                        // If its an Exploration Scanner we need to adjust the width of the panel
                        if ($(selectedParent).data('moduletype') == "Exploration Scanner") {
                            $(moduleSelector).addClass("moduleSelectorItemPanelExplorationScannerOffset");
                        }

                        $(moduleClassID).addClass('focusHighlight');
                        $(moduleSelector).css({ visibility: "visible" });

                    })
            })  

        }

        function displayModuleSelectorGroup(sender)
        {
            $(function ()
            {
                var frameworkContainerLeft;
                var moduleBayLeft;
                var moduleBayTop;
                var moduleBayBorder;
                var standardBorder = 2;
                var moduleBay = '#' + sender;
                var moduleClassID = '#ModuleClass' + $(moduleBay).data('configid');
                var moduleSelector = '#ModuleSelectorGroupPanel'

                // Init the selector container - height may have manually been overridden in previous renders.
                $(moduleSelector).css({'height':'auto',   'overflow-y': 'visible' });

                // Its possible that the item selector was visible and they clicked straight on another module bay. Hide it.
                $("#ModuleSelectorItemPanel").css({ visibility: "hidden" });

                // Do not render if the event was bubbled up from a Power Checkbox click event
                if (powerRegionClicked()) { return; }
        
                // AJAX call to populate module group selector with data based on current module selection and render it
                $.get(groupUrl, {
                    configID: $(moduleBay).data('configid'),
                    shipName: $(moduleBay).data('ship'),
                    sectionName: $(moduleBay).data('section'),
                    moduleClass: $(moduleBay).data('moduleclass'),
                    moduleType: "'" + $(moduleBay).data('moduletype')+ "'"
                },
                    function (data)
                    {
                        $(moduleSelector).html(data);

                        frameworkContainerLeft = Math.round($('#FrameworkContainer').offset().left);
                        moduleBayLeft = Math.round($(moduleBay).offset().left) - frameworkContainerLeft;
                        moduleBayTop = Math.round($(moduleBay).offset().top);
                        moduleBayBorder = standardBorder;

                        currentGroupContainerX1 = moduleBayLeft;
                        currentGroupContainerX2 = currentGroupContainerX1 + $(moduleSelector).outerWidth();
                        currentGroupContainerY1 = moduleBayTop + $(moduleBay).outerHeight() - moduleBayBorder ;
                        currentGroupContainerY2 = currentGroupContainerY1 +  $(moduleSelector).outerHeight();

                        // Render the drop down within the viewport boundary. Either drop it down or pop it up from the module bay origin.
                        // Overlap the border of the module bay and the selector using the moduleBayBorder offset.
                        if (currentGroupContainerY2 > $(window).height() - windowEdgeClearance) {
                            
                            // If the dropdown clips the window boundary we need to resize it and add a scrollbar in the Y axis
                            while ($(moduleSelector).outerHeight() > $(moduleBay).offset().top)
                            {
                                // Subtract row height from selector height until it no longer clips (use the first rows height metrics)
                                $(moduleSelector).height($(moduleSelector).height() - $('#ModuleSelectorTypeContainerEmpty').height());
                                $(moduleSelector).css({ 'overflow-y': 'scroll' });
                            }
                                                        
                            $(moduleSelector).css({ top: moduleBayTop + moduleBayBorder - $(moduleSelector).outerHeight() });
                             
                            // Set the new container Y variables
                            currentGroupContainerY1 = moduleBayTop + moduleBayBorder - $(moduleSelector).outerHeight()
                            currentGroupContainerY2 = currentGroupContainerY1 + $(moduleSelector).outerHeight();
                        }
                        else
                        {
                            $(moduleSelector).css({ top: moduleBayTop - moduleBayBorder + $(moduleBay).outerHeight() });
                        }
                
                        $(moduleClassID).addClass('focusHighlight');
                        $(moduleSelector).css({ left: moduleBayLeft });
                        $(moduleSelector).css({ visibility: "visible" });

                    })
            })
        }

        function deleteBuild()
        {
            // AJAX call to Ship/DeleteBuild 
            $.get(deleteUrl, {
                commanderName: 'System',
                shipName: $('#OutfittingTitle').data('shipname'),
                buildName: $('#BuildText').val()
            },
                function (data) {
                    $('#Result').html(data);
                    alert($('#ResultText').data('message'));
                    if ($('#ResultText').data('url') != "")
                    {
                        window.location = $('#ResultText').data('url');
                    }
                }
            );
        }

        function saveBuild()
        {
            // Enumerate the module description containers which contain the keys and build a string of : delimited configID_moduleID~powerStatus key pairs
            var configModuleKeys='';
            var keyPair = '';
            var powerStatus = "";

            $('[id^=ModuleDescription]').each(
                function ()
                {
                    keyPair = $(this).data('configid') + "_" + $(this).data('moduleid');
                    powerStatus = $('#ModulePowerCheckbox' + $(this).data('configid')).prop('checked');
                    if (powerStatus === undefined) {powerStatus = false;}
                    configModuleKeys += keyPair + "~" + powerStatus + ":";
                }
            );

            // Trim the last ':'
            configModuleKeys = configModuleKeys.substr(0, configModuleKeys.length -1)

            // AJAX call to Ship/SaveBuild 
            $.get(saveUrl, {
                commanderName: 'System',
                shipName: $('#OutfittingTitle').data('shipname'),
                originalBuildName: $('#OutfittingTitle').data('buildname'),
                newBuildName: $('#BuildText').val(),
                configModuleKeys: configModuleKeys},
                function (data)
                {
                    $('#Result').html(data);
                    alert($('#ResultText').data('message'));
                    // New record - update URL to reflect
                    if ($('#ResultText').data('url') != "")
                    {
                        window.location = $('#ResultText').data('url');
                    }
                }
            );
        }

        function saveBuildJson() {

            // Setup View Model
            var model = new BuildViewModel();
            model.CommanderName = 'System';
            model.ShipName = $('#OutfittingTitle').data('shipname');
            model.OriginalBuildName = $('#OutfittingTitle').data('buildname');
            model.NewBuildName = $('#BuildText').val();

            // Enumerate the module description containers which contain the keys and construct an array of ModuleBay objects
            $('[id^=ModuleDescription]').each(
                function ()
                {
                    // New ModuleBay object 
                    var b = new ModuleBay();
                    b.ConfigID = $(this).data('configid') 
                    b.ModuleID = $(this).data('moduleid');
                    var powerStatus = $('#ModulePowerCheckbox' + $(this).data('configid')).prop('checked')
                    if (powerStatus === undefined)
                    {
                        b.PowerStatus = false;
                    }
                    else
                    {
                        b.PowerStatus = powerStatus;
                    }
            
                    // Add the module bay to the array
                    model.ModuleBays.push(b);
                }
            );
  
            // AJAX call to Ship/SaveBuildJson 
            $.ajax({
                url: saveJsonUrl,
                async: false,
                type: "POST",
                data: JSON.stringify(model),  // data to server
                dataType: "html", // type of data from server
                contentType: "application/json; charset=utf-8", // type of data to server
                error: function (jqXHR, textStatus, errorThrown)
                {
                    alert(jqXHR + "-" + textStatus + "-" + errorThrown);
                },
                success: function (data)
                {
                    $('#Result').html(data);
                    alert($('#ResultText').data('message'));
                    // New record - update URL to reflect
                    if ($('#ResultText').data('url') != "") {
                        window.location = $('#ResultText').data('url');
                    }
                }
            });
        }

