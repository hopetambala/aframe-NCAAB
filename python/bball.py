from google.cloud import bigquery
import bq_helper  # Helper functions for putting BigQuery results in Pandas DataFrames https://github.com/SohierDane/BigQuery_Helper
from pandas import DataFrame
import secret_data

#https://google-auth.readthedocs.io/en/latest/user-guide.html#service-account-private-key-files

client = bigquery.Client(project=secret_data.PROJECT_ID)

ncaa_basketball = bq_helper.BigQueryHelper(active_project="bigquery-public-data", dataset_name="ncaa_basketball")

# List of all the tables in the ncaa_basketball dataset
tables = ncaa_basketball.list_tables()


#TWO REQUIRED DATASETS
#mbb_historical_teams_seasons
#mbb_teams

# Query of All Data from Teams Games
old_query = """SELECT * 
            FROM `bigquery-public-data.ncaa_basketball.mbb_teams_games_sr`"""

old_query2 = """
    SELECT 
        team_code,
        season,
        market, 
        name, 
        alias, 
        current_division, 
        wins, 
        losses,
        ties,
        (wins / losses) AS pct
    FROM 
        `bigquery-public-data.ncaa_basketball.mbb_historical_teams_seasons`
    WHERE 
        2013 = season;
"""

query = """
    SELECT 
        season,
        round,
        win_seed,
        win_market,
        win_name,
        win_alias,
        win_school_ncaa,
        win_pts,
        lose_seed,
        lose_market,
        lose_name,
        lose_school_ncaa,
        lose_pts
    FROM `bigquery-public-data.ncaa_basketball.mbb_historical_tournament_games` as teams_tournament
    WHERE 2013 = season;
"""

df = ncaa_basketball.query_to_pandas_safe(query, max_gb_scanned=1)
#df.to_csv(r'generated_data/'+'2013_season'+'.csv')
df.to_csv('2013_season'+'.csv')


# Print 10000 Records of Each Table
'''
for x in tables:
    df = ncaa_basketball.head(x,10000)
    df.to_csv(r'generated_data/'+str(x)+'.csv')
    print('Generated '+ str(x))

# Table schema
for x in tables:
    df = ncaa_basketball.table_schema(x)
    print(df)
'''


