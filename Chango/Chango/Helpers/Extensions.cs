using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Dynamic;
using System.Web.Routing;

namespace Chango.Helpers
{
    public enum StandardModule
    {
        Bulkheads = 1,
        PowerPlant = 2,
        Thrusters = 3,
        FrameShiftDrive = 4,
        LifeSupport = 5,
        PowerDistributor = 6
    }

    public static class Extensions
    {


        public static ExpandoObject ToExpando(this object anonymousObject)
        {
            IDictionary<string, object> anonymousDictionary = new RouteValueDictionary(anonymousObject);
            IDictionary<string, object> expando = new ExpandoObject();
            foreach (var item in anonymousDictionary)
                expando.Add(item);
            return (ExpandoObject)expando;
        }
    }
}