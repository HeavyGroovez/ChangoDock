//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Chango.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class ShipBuild
    {
        public ShipBuild()
        {
            this.ShipModuleBuild = new HashSet<ShipModuleBuild>();
        }
    
        public int ID { get; set; }
        public string CommanderName { get; set; }
        public string Name { get; set; }
        public string ShipName { get; set; }
    
        public virtual Commander Commander { get; set; }
        public virtual Ship Ship { get; set; }
        public virtual ICollection<ShipModuleBuild> ShipModuleBuild { get; set; }
    }
}
