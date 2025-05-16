{
	"name" : "vorTEX",
	"version" : 1,
	"creationdate" : 3807309942,
	"modificationdate" : 3830212305,
	"viewrect" : [ 0.0, 115.0, 1529.0, 901.0 ],
	"autoorganize" : 0,
	"hideprojectwindow" : 0,
	"showdependencies" : 1,
	"autolocalize" : 0,
	"contents" : 	{
		"patchers" : 		{
			"vortex.maxpat" : 			{
				"kind" : "patcher",
				"local" : 1,
				"toplevel" : 1
			}
,
			"vortex-mesh-process_2.maxpat" : 			{
				"kind" : "patcher",
				"local" : 1
			}

		}
,
		"code" : 		{
			"brcosa.genjit" : 			{
				"kind" : "genjit",
				"local" : 1
			}
,
			"server.js" : 			{
				"kind" : "javascript",
				"local" : 1
			}
,
			"xfade.genjit" : 			{
				"kind" : "genjit",
				"local" : 1
			}

		}
,
		"externals" : 		{

		}
,
		"other" : 		{

		}

	}
,
	"layout" : 	{

	}
,
	"searchpath" : 	{
		"0" : 		{
			"bootpath" : "~/Documents/GitHub/vorTEX/node",
			"projectrelativepath" : "./node",
			"label" : "",
			"recursive" : 1,
			"enabled" : 1,
			"includeincollective" : 1
		}

	}
,
	"detailsvisible" : 0,
	"amxdtype" : 0,
	"readonly" : 0,
	"devpathtype" : 0,
	"devpath" : ".",
	"sortmode" : 0,
	"viewmode" : 0,
	"includepackages" : 0,
	"openactions_internal" : "max objectfile jit.geom.tomatrix jit.geometry jit.geom.tomatrix;\n"
}
