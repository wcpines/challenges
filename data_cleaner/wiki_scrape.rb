require 'byebug'
require 'open-uri'
require 'json'
require 'nokogiri'




# - open the best picture wiki at "https://en.wikipedia.org/wiki/Academy_Award_for_Best_Picture"
# - find the winners list (#Winners_and_nominees)
  # - the winner is always BG yellow
# - the winner is always the first in each table

base_url = "https://en.wikipedia.org"
nominations_page_slug = "/wiki/Academy_Award_for_Best_Picture"

films = Nokogiri::HTML(open(base_url + nominations_page_slug)).css('table.wikitable')

results_array = films.each do |film|
  year = film.at_css('caption').text
  winner_name = film.at_css('td').text

  detail_url = base_url + film.at_css('td').at_css('a').attr('href')
  page = Nokogiri::HTML(open(detail_url))
  info = page.at_css('table.infobox.vevent')

  budget = info.search("[text()*='Budget']").first.next_element.text rescue nil

  {
    year: year,
    winner_name: winner_name,
    budget: budget || "na"
  }
end

puts results_array
