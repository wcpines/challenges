require "csv"

# Read 2 CSVs, inner join on userid, return joined rows, but
# the min score columns should be combined, using the min of the
# min_score of each CSV

# Approach: Convert each CSV to a nested hash, with the first level keyed by userid
# Merge both hashes using userid, taking only min of min_score column

class CsvJoins
  AGE_SCORES = <<~txt
    userid,age,min_score
    1,23,6
    6,54,300
    2,39,40
  txt

  STATE_SCORES = <<~txt
    userid,state,min_score
    1,CA,12
    6,AK,44
    2,WA,100
  txt

  OUTPUT_FILE = "min_scores.csv"

  def self.run(age_scores = AGE_SCORES, state_scores = STATE_SCORES)
    ages_by_id = parse_csv_by_id(age_scores)
    states_by_id = parse_csv_by_id(state_scores)

    combined = ages_by_id.map do |userid, age_data|
      min_score = [
        states_by_id[userid]["min_score"].to_i,
        age_data["min_score"].to_i,
      ].min

      {
        "userid" => userid,
        "age" => age_data["age"],
        "state" => states_by_id[userid]["state"],
        "min_score" => min_score,
      }
    end

    save_hash_to_csv(combined)
  end

  def self.save_hash_to_csv(hash_rows)
    CSV.open(
      OUTPUT_FILE,
      "wb",
      write_headers: true,
      headers: hash_rows[0].keys,
    ) do |csv|
      hash_rows.each { |row| csv.add_row(row.values) }
    end

    File.read(OUTPUT_FILE)
  end

  def self.parse_csv_by_id(csv)
    File.exist?(csv) || File.write("temp.csv", csv)
    CSV
      .read("temp.csv", headers: true)
      .map(&:to_h)
      .each_with_object({}) do |row, new_hash|
      new_hash[row.delete("userid")] = row
    end
  end
end
