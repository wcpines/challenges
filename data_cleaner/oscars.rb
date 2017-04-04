require 'HTTParty'


class DataCleaner
  attr_accessor :winners, :url, :results,

  def initialize(url)
    # Initializes with the API URL and a result set.
    self.url = url
    self.results = HTTParty.get(self.url)['results']
    self.winners = []
  end


  def clean_data
    # Iterate through all the film hashes and append a new hash to the
    # instance's winner's array. Hash contains only winners, and normalized
    # years for each winner. For simplicity, the script treats combined years
    # (e.g. 1932 / 1933 ) as the latter year, given that the rest
    # continue from 1934. Also removes citation cruft from film titles.

    self.results.reduce({}) do |memo_hash, result_hash|
      memo_hash = result_hash['films'].select { |f| f["Winner"] }[0]
      if result_hash["year"].include?(" / ")
        memo_hash["Year"] = result_hash["year"][0..1] + result_hash["year"][7..8]
        memo_hash["Film"] = result_hash['films'][0]['Film'].gsub(/\s+\[.*$/,'')
      else
        memo_hash["Year"] = result_hash["year"][0..3]
        memo_hash["Film"] = result_hash['films'][0]['Film'].gsub(/\s+\[.*$/,'')
      end
      self.winners << memo_hash
    end

  end

  def add_budget
    # Iterate through the winners array and for each winner, follow the details
    # URL to retrieve the budget information, adding it to each winner hash.
    # If there is no budget listed, return '<Budget Not Listed>'.

    unless winners.empty?
      self.winners.map do |winner|
        data = HTTParty.get(winner['Detail URL'])
        if data["Budget"]
          winner['Budget'] = data["Budget"]
        else
          winner['Budget'] = ''
        end
      end
    end
  end

  def normalize_budget

    # Converts each budget value to an integer of the same amount.  Method
    # accounts for budgets listed in GBP using a ~26year average exchange rate
    # of 1.64.  If more currencies creep into the data, either add case
    # statements or find a cleaner data source. Exchange rate source:
    # http://fxtop.com/en/historical-exchange-rates.php?YA=1&C1=GBP&C2=USD&A=1&YYYY1=1990&MM1=01&DD1=01&YYYY2=2016&MM2=12&DD2=28&LANG=en

    self.winners.map do |winner|

      # Remove citations and any leading characters that aren't currency denominations
      # For range estimates, choose highest in range to avoid having to average edge-cases
      winner['Budget'].gsub!(/\s*\[.*\]|^[^£|$]*|[^\d*|'million']*$|.*-/,'')

      if winner['Budget'][0] == '£'

        # Match any digits + million, including decimals, and use digits in the grouping
        # to convert to actual integer amount.
        if match = winner['Budget'].match(/(\d*\.?\d+).*million/)
          winner['Budget'] = (match.captures[0].to_f * 1.64 * 1000000).to_i

        # Match plain numbers + commas
        elsif match = winner['Budget'].match(/([-,0-9]+)/)
          winner['Budget'] = (match.captures[0].gsub(/,/,"").to_f * 1.64).to_i
        else
          winner['Budget'] = '<Budget Not Listed>'
        end

      #USD--no conversion
      else
        if match = winner['Budget'].match(/(\d*\.?\d+).*million/)
          winner['Budget'] = (match.captures[0].to_f * 1000000).to_i
        elsif match = winner['Budget'].match(/([-,0-9]+)/)
          winner['Budget'] = match.captures[0].gsub(/,/,"").to_i
        else
          winner['Budget'] = '<Budget Not Listed>'
        end
      end
    end
  end


  def get_average
    # Method isolates all winners with budgets listed, and adds them together
    # and divides the total by the total number.

    has_budget = self.winners.select { |w| w['Budget'].class == Fixnum }
    has_budget.reduce(0) { |memo, hash| memo + hash['Budget']} / has_budget.count # add all and divide by number for avg
  end

  def run
    # Runs each method above and prints out the result in the requested format:
    # Year-Title-Budget, after converting numbers back to strings and inserting
    # commas for readability.

    self.clean_data
    self.add_budget
    self.normalize_budget
    average = self.get_average.to_s.reverse.gsub(/...(?=.)/,'\&,').reverse

    self.winners.map do |w|
      if w['Budget'].to_s[0] == '<'
        budget = w['Budget']
      else
        budget = w['Budget'].to_s.reverse.gsub(/...(?=.)/,'\&,').reverse
      end
      puts w['Year'] + "-" + w['Film'] + "-" + budget
    end

    puts "##########################\nAVERAGE BUDGET: #{average}\n##########################"

  end

end

# Initialize a new instance of the cleaner and run it!
c = DataCleaner.new('http://oscars.yipitdata.com/')
c.run
