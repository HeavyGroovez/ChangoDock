using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Chango.Models;
using System.Dynamic; // Access ExpandoObject
using Chango.Helpers; // Extensions for ExpandoObject
using Meta.Numerics;
using System.Diagnostics;

// Expando allows access to dynamic objects in Razor
// See http://stackoverflow.com/questions/5120317/dynamic-anonymous-type-in-razor-causes-runtimebinderexception

namespace Chango.Controllers
{

    public class ShipController : Controller
    {

        private EliteContext db = new EliteContext();

        // GET: Ship
        public ActionResult Index()
        {

            var ships = db.Ship.OrderBy(s => s.Name);

            return View(ships);
            
        }

        // Synchronous AJAX get to build Hangar partial view for the requested commander and return it.
        public ActionResult Hangar(string commanderName)
        {
            // Create the HangerViewModel excluding the default builds
            HangarViewModel hvm = new HangarViewModel();                       
            hvm.ShipBuilds = db.ShipBuild.Where(sb => sb.CommanderName == commanderName)
                                         .Where(sb => sb.Name != "Default").OrderBy(sb => sb.ShipName).ThenBy(sb => sb.Name).ToList<ShipBuild>();

            return PartialView("_Hangar",hvm);
        }

        // Synchronous AJAX post to update the settings. Returns results in partial view
        public ActionResult SaveSettings(string commanderName, bool showModulePrices, bool siriusDiscount)
        {
            // Locate the commander
            Commander cmdr = db.Commander.Where(c => c.Name == commanderName).First<Commander>();

            cmdr.ShowModulePrices = showModulePrices;
            cmdr.SiriusDiscount = siriusDiscount;

            if (ModelState.IsValid)
            {
                try
                {
                    db.SaveChanges();
                    ViewBag.Result = true;
                    ViewBag.Message = "";
                }
                catch (Exception ex)
                {
                    ViewBag.Result = false;
                    ViewBag.Message = ex.Message;
                }
            }
            else
            {
                ViewBag.Result = false;
                ViewBag.Message = "Invalid Model State - Settings Not Saved.";
            }
            return PartialView("_Result");
        }

        // Asynchronous AJAX post to load settings. Returns the Settings object as JSON
        public ActionResult LoadSettings(string commanderName)
        {
            // Get the commander
            Commander cmdr = db.Commander.Where(c => c.Name == commanderName).First<Commander>();
            
            Settings s = new Settings();
            s.CommanderName = cmdr.Name;
            s.SiriusDiscount = cmdr.SiriusDiscount;
            s.ShowModulePrices = cmdr.ShowModulePrices;

            return Json(s);
        }

        // Synchronous AJAX post to save the current build using Json. 
        // Returns _Result partial view populated with results of action and URL of new build if action was successfull
        public ActionResult SaveBuildJson(BuildViewModel model)
        {
            ViewBag.URL = "";
            ViewBag.Result = false;
            ShipBuild sb;
            ShipModuleBuild smb;

            // Determine if this is an update to an existing build or a brand new build.
            bool update = model.OriginalBuildName == "Default" ? false : true;

            if (update)
            {
                // Get the ship build and update the buld name
                sb = db.ShipBuild.Where(s => s.CommanderName == model.CommanderName).Where(s => s.Name == model.OriginalBuildName).FirstOrDefault<ShipBuild>();
                sb.Name = model.NewBuildName.Trim();
            }
            else
            {
                // Create the new ship build
                sb = new ShipBuild();
                sb.CommanderName = model.CommanderName;
                sb.ShipName = model.ShipName;
                sb.Name = model.NewBuildName.Trim();
                db.ShipBuild.Add(sb);
            }

            foreach (ModuleBay b in model.ModuleBays)
            {
               
                if (update)
                {
                    // Find the module build object
                    smb = sb.ShipModuleBuild.Where(o => o.ShipModuleConfigurationID == b.configID).FirstOrDefault<ShipModuleBuild>();

                    // Update the moduleID and power status
                    smb.ModuleID = b.moduleID;
                    smb.PowerStatus = b.powerStatus;
                }
                else
                {
                    // Create the module build object
                    smb = new ShipModuleBuild();
                    smb.ModuleID = b.moduleID;
                    smb.ShipModuleConfigurationID = b.configID;
                    smb.PowerStatus = b.powerStatus;

                    // Add it to the ship module build entity
                    sb.ShipModuleBuild.Add(smb);
                }
            }

            // Update the model
            if (ModelState.IsValid)
            {
                try
                {
                    db.SaveChanges();
                    ViewBag.Message = "Build Saved - " + model.NewBuildName;
                    ViewBag.URL = Url.Action("Outfitting", "Ship", new { name = model.ShipName, build = model.NewBuildName.Trim()}, "http");
                    ViewBag.Result = true;
                }
                catch (Exception ex)
                {
                    if (ex.InnerException.ToString().Contains("duplicate key"))
                    {
                        ViewBag.Message = "Build Not Saved. Duplicate Build Name - " + model.NewBuildName;
                    }
                    else
                    {
                        ViewBag.Message = ex.InnerException.ToString();
                    }
                    ViewBag.Result = false;
                }
            }
            else
            {
                ViewBag.Message = "Build Not Saved. Invalid Model State.";
                ViewBag.Result = false;
            }

            return PartialView("_Result");

        }

        // AJAX call to save the current build. 
        // Returns _Result partial view populated with results of action and URL of new build if action was successfull
        public ActionResult SaveBuild(string commanderName, string shipName, string originalBuildName, string newBuildName, string configModuleKeys)
        {
            ViewBag.URL = "";
            ViewBag.Result = false;
            ShipBuild sb;
            ShipModuleBuild smb ;

            // Determine if this is an update to an existing build or a brand new build.
            bool update = false;

            if (originalBuildName != newBuildName)
            {
                update = false;

                // Check to see that the build name does not already exist for this commander
                if  (db.ShipBuild.Where(s => s.CommanderName == commanderName).Where(s => s.Name == newBuildName).ToList<ShipBuild>().Count > 0)
                {
                    ViewBag.Result = false;
                    ViewBag.Message = "Build Not Saved. Duplicate Build Name.";
                    return PartialView("_Result");
                }
            }
            else
            {
                update = true;
            }

            if (update)
            {
                // Get the ship build
                sb = db.ShipBuild.Where(s => s.CommanderName == commanderName).Where(s => s.Name == originalBuildName).FirstOrDefault<ShipBuild>();
            }
            else
            {
                // Create the new ship build
                sb = new ShipBuild();
                sb.CommanderName = commanderName;
                sb.ShipName = shipName;
                sb.Name = newBuildName.Trim();
                db.ShipBuild.Add(sb);
            }

            // Delimit and extract the keys (configID_ModuleID~powerStatus:configID_ModuleID~powerStatus)
            string[] records;
            string[] record;
            string keyPair;
            string[] keys;
            bool power;

            char[] separator1 = {':'};
            char[] separator2 = {'_'};  
            char[] separator3 = {'~'};

            records = configModuleKeys.Split(separator1);

            foreach (string s in records)
            {
                // Delimit and extract records
                record = s.Split(separator3);

                // Array of key pair and power
                keyPair = record.ElementAt(0);
                power = Convert.ToBoolean(record.ElementAt(1));

                // Array of keys
                keys = keyPair.Split(separator2);
                int configID = Convert.ToInt32(keys.ElementAt(0).ToString());
                int moduleID = Convert.ToInt32(keys.ElementAt(1).ToString());
                
                if (update)
                {
                    // Find the module build object
                    smb = sb.ShipModuleBuild.Where(o => o.ShipModuleConfigurationID == configID).FirstOrDefault<ShipModuleBuild>();
                             
                    // Update the moduleID and power status
                    smb.ModuleID = moduleID;
                    smb.PowerStatus = power;
                }
                else
                { 
                    // Create the module build object
                    smb = new ShipModuleBuild();
                    smb.ModuleID = moduleID;
                    smb.ShipModuleConfigurationID = configID;
                    smb.PowerStatus = power;

                    // Add it to the ship module build entity
                    sb.ShipModuleBuild.Add(smb);
                }
            }

            // Update the model
            if (ModelState.IsValid)
            {
                try
                {
                    db.SaveChanges();
                    ViewBag.Message = "Build Saved.";
                    if (!update) 
                    {
                        ViewBag.URL = Url.Action("Outfitting", "Ship", new { name = shipName, build = newBuildName },"http");
                    } 
                    ViewBag.Result = true;
                }
                catch (Exception ex)
                {
                    ViewBag.Message = ex.Message;
                    ViewBag.Result = false;
                }
            }
            else
            {
                ViewBag.Message = "Build Not Saved. Invalid Model State.";
                ViewBag.Result = false;
            }

            return PartialView("_Result");

        }

        // AJAX call to delete the currently selected build. 
        // Returns _Result partial view populated with results of action and URL of default build if action was successfull
        public ActionResult DeleteBuild(string commanderName, string buildName, string shipName)
        {
            ViewBag.URL = "";
            ViewBag.Result = false;

            List<ShipBuild> shipBuilds = db.ShipBuild.Where(s => s.CommanderName == commanderName).Where(s => s.Name == buildName).ToList<ShipBuild>();
            if (shipBuilds.Count == 0)
            {
                ViewBag.Message = "Build Does Not Exist - " + buildName;
                ViewBag.Result = false;               
                return PartialView("_Result");
            }
            else
            {
                db.ShipBuild.Remove(shipBuilds.First<ShipBuild>());
                if (ModelState.IsValid)
                {
                    try
                    {
                        db.SaveChanges();
                        ViewBag.Message = "Build Deleted - " + buildName;
                        ViewBag.URL = Url.Action("Outfitting", "Ship", new { name = shipName, build = "Default" },"http"); // default build for current ship
                        ViewBag.Result = true;
                    }
                    catch (Exception ex)
                    {
                        ViewBag.Message = ex.Message;
                        ViewBag.Result = true;
                    }
                }
                else
                {
                    ViewBag.Message = "Invalid Model State. Build Not Deleted";
                    ViewBag.Result = false;
                }
                return PartialView("_Result");
            }
        }

        // AJAX call to return the available module items for the selected module type 
        // The partial view is rendered into the #ModuleSelectorItemContainer div
        public ActionResult ModuleSelectorItem(int configID, string shipName, string sectionName, int moduleClass, string moduleType)
        {
            
            List<Module> modules;

            if (moduleType == "Sensors" || moduleType == "Life Support")
            { 
                modules =   (from m in db.Module
                            where m.Type == moduleType
                            where m.Class == moduleClass
                            where m.Section == sectionName
                            orderby m.Name,m.Class descending,m.Rating
                            select m).ToList<Module>(); 
            }
            else if (moduleType == "Bulkheads") 
            {
                modules =   (from m in db.Module
                            where m.Type == moduleType
                            where m.Class == moduleClass
                            where m.Section == sectionName
                            where m.ShipSpecific == shipName
                            orderby m.Price
                            select m).ToList<Module>(); 
            }
            else 
            {
                modules =   (from m in db.Module
                            where m.Type == moduleType
                            where m.Class <= moduleClass
                            where m.Section == sectionName
                            orderby m.Name, m.Class descending, m.Rating
                            select m).ToList<Module>(); 
            }


            // Check the order
            foreach (Module mod in modules)
            {
                Debug.WriteLine("Class=" + mod.Class.ToString() + " Rating=" + mod.Rating + " Name=" + mod.Name);
            }

            // Module bay we want to populate
            ViewBag.ConfigID = configID;
            ViewBag.ModuleType = moduleType;

            // Show Module Prices ?
            ViewBag.ShowModulePrices = db.Commander.Where(c => c.Name == "System").First<Commander>().ShowModulePrices;

            return PartialView("_ModuleSelectorItem", modules);
        }

        // AJAX call to return the distinct module groups for the selected slot 
        // The partial view is rendered into the #ModuleSelectorGroupContainer div
        public ActionResult ModuleSelectorGroup(int configID, string shipName,string sectionName, int moduleClass, string moduleType) 
        {
            List<string> moduleGroups;

            List<Module> utils = new List<Module>();

            if (sectionName == "Standard")
            {
                moduleGroups = db.Module.Where(m => m.Section == sectionName)
                                         .Where(m => m.Class <= moduleClass)
                                         .Where(m => m.Type == moduleType.Replace("'",""))
                                         .OrderBy(m => m.Type)
                                         .Select(m => m.Type).Distinct().ToList<string>();
            }
            else
            {
                moduleGroups = db.Module.Where(m => m.Section == sectionName)
                                         .Where(m => m.Class <= moduleClass)
                                         .OrderBy(m => m.Type)
                                         .Select(m => m.Type).Distinct().ToList<string>();

                // Make the module ids available in the group selector to save on dropping down an item selector for single item utility groups
                if (sectionName == "Utility")
                {
                    utils = db.Module.Where(m => m.Type == "Chaff Launcher" ||
                                            m.Type == "Heat Sink Launcher" ||
                                            m.Type == "Electronic Countermeasure" ||
                                            m.Type == "Point Defence").ToList<Module>();
                }
            }

            ViewBag.ConfigID = configID;
            ViewBag.ModuleGroups = moduleGroups;
            ViewBag.ShipName = shipName;
            ViewBag.SectionName = sectionName;
            ViewBag.ModuleClass = moduleClass;
            ViewBag.ModuleType = moduleType;
            ViewBag.Utilities = utils;

            return PartialView("_ModuleSelectorGroup");
        }

        public ActionResult Outfitting(string name, string build)
        {

            // Initialise the view model
            OutfittingViewModel ovm = new OutfittingViewModel();

            // Get Ship
            ovm.Ship = db.Ship.Find(name);

            // Get all modules 
            ovm.Modules = db.Module.ToList<Module>();

            // Get build 
            ovm.ShipBuild = ovm.Ship.ShipBuild.Where(b => b.CommanderName == "System" && b.Name == build).FirstOrDefault();

            // Get module build 
            ovm.ModuleBuild = ovm.ShipBuild.ShipModuleBuild.ToList<ShipModuleBuild>();
            
            // Get module bays for all sections of the ship
            ovm.DefaultModuleConfiguration =   ovm.Ship.ShipModuleConfiguration
                                               .OrderBy(s => s.OrderID)
                                               .ToList<ShipModuleConfiguration>();


            return View(ovm);
        }

        public ActionResult Module(string shipName, int configID, int moduleID, int moduleClass, string section, bool powerStatus)
        {

            // Get module for view
            Module mod = db.Module.Find(moduleID);
            mod.SelectorConfigID = configID;
            mod.SelectorModuleClass = moduleClass;
            mod.SelectorSection = section;
            mod.SelectorShipName = shipName;
            mod.SelectorPowerStatus = powerStatus;

            return PartialView("_Module", mod);

        }

        private double CalculateShieldStrength(Ship s, Module m)
        {

            Shield shield = new Shield();

            shield.ShipBaseShield = s.Shields;
            shield.ShipHullMass = s.Mass;

            shield.MinMass = m.MinMass ?? 0;
            shield.OptMass = m.OptimalMass ?? 00;
            shield.MaxMass = m.MaxMass ?? 0;

            shield.MaxMultiplier = m.MaxMultiplier ?? 0;
            shield.MinMultiplier = m.MinMultiplier ?? 0;
            shield.OptMultiplier = m.OptMultiplier ?? 0;

            return shield.Strength();
            
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
