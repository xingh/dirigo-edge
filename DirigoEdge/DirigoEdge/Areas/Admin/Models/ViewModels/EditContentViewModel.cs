﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Security;
using DirigoEdge.Models.DataModels;

namespace DirigoEdge.Areas.Admin.Models.ViewModels
{
	public class EditContentViewModel
	{
		public ContentPage ThePage;
		public Dictionary<string, ContentTemplate> Templates;
		public bool UseWordWrap;

		public EditContentViewModel(int id)
		{
			using (DataContext context = new DataContext())
			{
				ThePage = context.ContentPages.Where(x => x.ContentPageId == id).Take(1).FirstOrDefault();
				var userName = Membership.GetUser().UserName;
				UseWordWrap = context.Users.FirstOrDefault(x => x.Username == userName).ContentAdminWordWrap;

				// Take Care of any legacy pages that don't have a publish date associated
				if (ThePage.PublishDate == null)
				{
					ThePage.PublishDate = DateTime.Now;
					context.SaveChanges();
				}

				Templates = new ContentTemplates().Templates;
			}
		}
	}
}