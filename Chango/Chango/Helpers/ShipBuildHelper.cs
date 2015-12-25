using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Chango.Interfaces;
using Chango.Models;
using System.Data.Entity.Core.Objects;

namespace Chango.Helpers
{
    public class ShipBuildHelper : IRender
    {
        string ShipName { get; set; }

        // Default constructor
        public ShipBuildHelper()
        {
          
        }

        // Constructor with shipName
        public ShipBuildHelper(string shipName)
        {
            ShipName = shipName;
        }

        string IRender.RenderAsHTML(EliteContext db)
        {
            string html="";

            // Ship not set
            if (ShipName == ""){throw new Exception("ShipBuildHelper.IRender.RenderAsHtml. Ship property is empty.");}

            // Get the ship builds via the sproc
            List<SelectShipBuilds_Result> ssbr = db.SelectShipBuilds(ShipName).ToList<SelectShipBuilds_Result>(); 

            // Enumerate and build the HTML string
            foreach(SelectShipBuilds_Result sb in ssbr)
            {
                html += "<div>" + sb.Name + "</div>";
            }

            return html;
        }
    }
}