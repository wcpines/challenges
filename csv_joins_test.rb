require "minitest/autorun"
require_relative "csv_joins"

class CsvJoinsTest < Minitest::Test
  def test_csv_merge
    expected = <<~txt
      userid,age,state,min_score
      1,23,CA,6
      2,39,WA,40
      6,54,AK,44
    txt

    actual = CsvJoins.run()

    assert expected.split(/\n/).sort == actual.split(/\n/).sort
  end
end
