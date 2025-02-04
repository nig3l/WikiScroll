import { useState } from "react";

interface WikiArticle {
  title: string;
  extract: string;
  pageid: number;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = reject;
  });
};

export function useWikiArticles() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<WikiArticle[]>([]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "query",
            format: "json",
            generator: "random",
            grnnamespace: "0",
            prop: "extracts|pageimages",
            grnlimit: "40",
            exintro: "1",
            exchars: "1000",
            exlimit: "max",
            explaintext: "1",
            piprop: "thumbnail",
            pithumbsize: "400",
            origin: "*",
          })
      );

      const data = await response.json();
      const newArticles = Object.values(data.query.pages)
        .map((page: any) => ({
          title: page.title,
          extract: page.extract,
          pageid: page.pageid,
          thumbnail: page.thumbnail,
        }))
        .filter((article) => article.thumbnail);
        
      await Promise.allSettled(
        newArticles
          .filter((article) => article.thumbnail)
          .map((article) => preloadImage(article.thumbnail!.source))
      );

      setArticles((prev) => [...prev, ...newArticles]);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
    setLoading(false);
  };

  const searchArticles = async (searchTerm: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "query",
            format: "json",
            list: "search",
            srsearch: searchTerm,
            prop: "extracts|pageimages",
            exintro: "1",
            exchars: "1000",
            explaintext: "1",
            piprop: "thumbnail",
            pithumbsize: "400",
            origin: "*",
          })
      );

      const data = await response.json();
      const results = await Promise.all(
        data.query.search.map(async (result: any) => {
          const fullArticle = await fetchFullArticle(result.pageid);
          return fullArticle;
        })
      );

      setSearchResults(results.filter((article) => article.thumbnail));
    } catch (error) {
      console.error("Error searching articles:", error);
    }
    setLoading(false);
  };

  const fetchFullArticle = async (pageId: number): Promise<WikiArticle> => {
    const response = await fetch(
      "https://en.wikipedia.org/w/api.php?" +
        new URLSearchParams({
          action: "query",
          format: "json",
          pageids: pageId.toString(),
          prop: "extracts|pageimages",
          exintro: "1",
          exchars: "1000",
          explaintext: "1",
          piprop: "thumbnail",
          pithumbsize: "400",
          origin: "*",
        })
    );

    const data = await response.json();
    const page = data.query.pages[pageId];
    return {
      title: page.title,
      extract: page.extract,
      pageid: page.pageid,
      thumbnail: page.thumbnail,
    };
  };

  const fetchRelatedArticles = async (pageId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "query",
            format: "json",
            generator: "links",
            gpllimit: "10",
            pageids: pageId.toString(),
            prop: "extracts|pageimages",
            exintro: "1",
            piprop: "thumbnail",
            origin: "*",
          })
      );

      const data = await response.json();
      const related = Object.values(data.query.pages || {}).map((page: any) => ({
        title: page.title,
        extract: page.extract,
        pageid: page.pageid,
        thumbnail: page.thumbnail,
      }));

      setRelatedArticles(related.filter((article) => article.thumbnail));
    } catch (error) {
      console.error("Error fetching related articles:", error);
    }
    setLoading(false);
  };

  return { 
    articles, 
    searchResults, 
    relatedArticles, 
    loading, 
    fetchArticles, 
    searchArticles, 
    fetchRelatedArticles 
  };
}