import React, { useEffect, useState } from "react";
import { useArticleDispatch, useArticleState } from "../../context/articles/context";
import { searchArticle } from "../../context/articles/actions";
import { useSportDispatch, useSportState } from "../../context/sports/context";
import { useTeamDispatch, useTeamState } from "../../context/teams/context";
import { searchSport } from "../../context/sports/actions";
import { searchTeam } from "../../context/teams/actions";
import { Articles, Sports, Teams, UserPreferences } from "../../types"; // Assuming you have types defined in a file named types.ts
import ArticleModal from "./ArticleModel"; 
import { API_ENDPOINT } from "../../config/constants";
import useUserPreferences from "./userpref";

const LiveArticles = () => {
  const dispatch = useArticleDispatch();
  const state: any = useArticleState();
  const { articles, isLoading, isError, errMsg } = state;

  const sportDispatch = useSportDispatch();
  const TeamDispatch = useTeamDispatch();
  const sportState: any = useSportState();
  const teamState: any = useTeamState();
  const { sports, isLoading: sportLoading, isError: sportError, errMsg: sportErrMsg } = sportState;
  const { teams, isLoading: teamLoading, isError: teamError, errMsg: teamErrMsg } = teamState;
  
  const [selectedSport, setSelectedSport] = useState<string>("All");
  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<Articles | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    sports: [],
    teams: [],
  });
  const [filteredArticles, setFilteredArticles] = useState<Articles[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await searchArticle(dispatch);
      } catch (articleError) {
        console.error('Error fetching articles:', articleError);
      }

      try {
        await searchSport(sportDispatch);
      } catch (sportError) {
        console.error('Error fetching sports:', sportError);
      }

      try {
        await searchTeam(TeamDispatch);
      } catch (teamError) {
        console.error('Error fetching teams:', teamError);
      }

      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_ENDPOINT}/user/preferences`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setUserPreferences(data.preferences);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    fetchData();
  }, [dispatch, sportDispatch, TeamDispatch]);

  useEffect(() => {
    // Function to fetch and filter articles
    const fetchAndFilterArticles = async () => {
      // Filter articles by user preferences
      const filteredArticles = articles.filter((article: Articles) => {
        const isSportMatch = selectedSport === "All" || article.sport.name === selectedSport;
        const isTeamMatch = selectedTeam === "All" || (article.teams && article.teams.some((team: Teams) => team.name === selectedTeam));
        const isUserPreferenceMatch = userPreferences && userPreferences.sports && userPreferences.sports.length === 0 || userPreferences.sports.includes(article.sport.id);

        return isSportMatch && isTeamMatch && isUserPreferenceMatch;      
      });
      setFilteredArticles(filteredArticles);
    };
    fetchAndFilterArticles();
  }, [articles, selectedSport, selectedTeam, userPreferences]);

  const handleOpenArticleModal = (article: Articles) => {
    setSelectedArticle(article);
  };

  const handleCloseArticleModal = () => {
    setSelectedArticle(null);
  };
  useEffect(() => {
    // Set the selectedSport based on user preferences when they change
    if (userPreferences && userPreferences.sports && userPreferences.sports.length > 0) {
      const selectedSportId = userPreferences.sports[0];
      const selectedSport = sports.find((sport: Sports) => sport.id === selectedSportId);
      if (selectedSport) {
        setSelectedSport(selectedSport.name);
      }
    } else {
      // If no user preferences are selected, set selectedSport to "All"
      setSelectedSport("All");
    }
  }, [userPreferences, sports]);
  
  return (
    <div>
      <p className="font-bold text-3xl text-black dark:text-white mb-4">Articles:</p>
<div className="flex items-center justify-center mb-4">
<label className="text-md font-semibold mr-2">Filter by sports:</label>
<select
  className="px-4 py-2 border-4 border-gray-300 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-300 ease-in-out hover:shadow-lg hover:bg-blue-100"
  value={selectedSport} 
  onChange={(event) => {
    setSelectedSport(event.target.value);
    // Automatically select the sport in user preferences if available
    if (userPreferences.sports.length > 0) {
      const selectedSportId = sports.find((sport: Sports) => sport.name === event.target.value)?.id;
      if (selectedSportId && userPreferences.sports.includes(selectedSportId)) {
        setSelectedSport(event.target.value);
      }
    }
  }}
>
  <option value="All">All Sports</option>
  {(!userPreferences || !userPreferences.sports || userPreferences.sports.length === 0) && (
  sports.map((sport: Sports) => (
    <option key={sport.id} value={sport.name}>
      {sport.name}
    </option>
  ))
)}


{userPreferences && userPreferences.sports && userPreferences.sports.length > 0 && (
    userPreferences.sports.map((sportId: number) => {
      const sport = sports.find((s: Sports) => s.id === sportId);
      return (
        <option key={sport?.id} value={sport?.name}>
          {sport?.name}
        </option>
      );
    })
  )}
</select>



<label className="text-md font-semibold ml-8 mr-2">Filter by Teams:</label>
<select
  className="px-4 py-2 border-4 border-gray-300 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-300 ease-in-out hover:shadow-lg hover:bg-blue-100"
  value={selectedTeam}
  onChange={(event) => setSelectedTeam(event.target.value)}
>
  <option value="All">All Teams</option>
  {teams
    .filter((team: Teams) => selectedSport === "All" || team.plays === selectedSport)
    .map((team: Teams) => (
      <option key={team.id} value={team.name}>
        {team.name}
      </option>
    ))}
</select>



</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 hover:-translate-y-1 hover:scale-105 cursor-pointer">
  {filteredArticles.map((article: Articles) => (
    <div
      key={article.id}
      className="flex flex-col rounded-lg bg-white border border-gray-200 shadow-md transition-all hover:bg-blue-200 duration-1000 hover:shadow-lg hover:-translate-y-1 hover:scale-105 cursor-pointer"
      onClick={() => handleOpenArticleModal(article)}
    >
      <img
        className="w-full rounded-t-lg object-cover h-48"
        src={article.thumbnail}
        alt="thumbnail"
      />
      <div className="p-6">
        <p className="text-xs text-neutral-500">
          {article.sport.name}
        </p>
        <h5 className="mt-2 text-xl font-semibold text-neutral-800">
          {article.title}
        </h5>
        <p className="mb-4 text-sm text-neutral-600">
          {article.summary}
        </p>
        <p className="text-xs text-neutral-500">
          {new Date(article.date).toDateString()}
        </p>
      </div>
    </div>
  ))}
</div>
{selectedArticle && (
  <ArticleModal article={selectedArticle} onClose={handleCloseArticleModal} />
)}
</div>
);
};

export default LiveArticles;